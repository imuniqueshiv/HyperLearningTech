import fs from "fs/promises";
import path from "path";

import {
  CMS_PENDING_PYQS_FILENAME,
  CMS_PENDING_SYLLABUS_FILENAME,
  CMS_WRITE_REPORT_FILENAME,
} from "./constants";
import {
  getDiagramManifestPath,
  readDiagramManifest,
  type DiagramManifest,
} from "./diagram-manifest";
import { createEmptyDiagramStats } from "./diagram-writer";
import { getJob, updateJobStatus } from "./import-queue";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import {
  readProductionPyqs,
  readProductionSyllabus,
} from "./schema-builder-service";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
} from "./schema-types";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { asPipelineError, MergeMetadataError } from "./string-normalize";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord } from "./types";
import { createIssue } from "./validation-report";
import { readValidationReport } from "./validation-service";
import {
  buildWriteReport,
  toWritingRunSummary,
  type WriteReport,
  type WritingRunSummary,
} from "./write-report";
import { writeProductionContent } from "./writer";
import { validateForWrite } from "./writer-validator";
import { normalizeSemester } from "./metadata-extractor";

export class WriterProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WriterProcessingError";
    this.code = code;
  }
}

export interface RunWriterResult {
  job: ImportJobRecord;
  summary: WritingRunSummary;
  report: WriteReport;
}

const writerInFlight = new Set<string>();

export function getWriteReportPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_WRITE_REPORT_FILENAME);
}

export async function readWriteReport(
  jobId: string
): Promise<WriteReport | null> {
  return readJsonFile<WriteReport>(getWriteReportPath(jobId));
}

export async function readJobDiagramManifest(
  jobId: string
): Promise<DiagramManifest | null> {
  return readDiagramManifest(getJobDirectory(jobId));
}

export function getJobDiagramManifestPath(jobId: string): string {
  return getDiagramManifestPath(getJobDirectory(jobId));
}

export function getSubjectContentDir(input: {
  branch: string;
  semester: string;
  subjectCode: string;
}): string {
  const branch = sanitizePathSegment(input.branch, "branch");
  const normalizedSemester =
    normalizeSemester(input.semester) ?? input.semester;
  const semester = sanitizePathSegment(normalizedSemester, "semester");
  const subjectCode = sanitizePathSegment(input.subjectCode, "subjectCode");
  const dir = path.resolve(
    process.cwd(),
    "content",
    "rgpv",
    branch,
    semester,
    subjectCode
  );
  assertSubjectContentPath(dir);
  return dir;
}

function sanitizePathSegment(value: string, label: string): string {
  const trimmed = value.trim().toLowerCase();
  if (
    !trimmed ||
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
    throw new WriterProcessingError(
      "CONTENT_PATH_REJECTED",
      `Invalid ${label} for content path.`
    );
  }
  return trimmed;
}

/**
 * Ensures a resolved absolute path stays inside content/rgpv.
 */
export function assertSubjectContentPath(absolutePath: string): void {
  const root = path.resolve(process.cwd(), "content", "rgpv");
  const resolved = path.resolve(absolutePath);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new WriterProcessingError(
      "CONTENT_PATH_REJECTED",
      "Content path is outside the allowed content/rgpv directory."
    );
  }
}

/**
 * Prepares production content preview for Review Center.
 * Advances: VALIDATED → WRITING → WRITTEN
 * Does NOT write to content/ — Local Save does that after approval.
 * Does not run git commands.
 */
export async function runWriterForJob(jobId: string): Promise<RunWriterResult> {
  if (writerInFlight.has(jobId)) {
    throw new WriterProcessingError(
      "WRITE_IN_PROGRESS",
      "Writer is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new WriterProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  // WRITING / DIAGRAMS_WRITING on disk are recoverable stale crash markers.
  if (
    currentStage !== PipelineStage.VALIDATED &&
    currentStage !== PipelineStage.WRITING &&
    currentStage !== PipelineStage.DIAGRAMS_WRITING &&
    currentStage !== PipelineStage.DIAGRAMS_WRITTEN &&
    currentStage !== PipelineStage.WRITTEN &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new WriterProcessingError(
      "VALIDATED_REQUIRED",
      "Writer requires VALIDATED first."
    );
  }

  if (!metadata.branch || !metadata.semester || !metadata.subjectCode) {
    throw new WriterProcessingError(
      "CONTENT_TARGET_REQUIRED",
      "Writer requires branch, semester, and subjectCode on the job."
    );
  }

  if (
    metadata.type === "pyq" &&
    (metadata.year == null || !metadata.examSession)
  ) {
    throw new WriterProcessingError(
      "METADATA_INCOMPLETE",
      "PYQ writer requires year and exam session. Confirm extracted metadata or set them manually."
    );
  }

  const incomingPyqs = await readProductionPyqs(jobId);
  const incomingSyllabus = await readProductionSyllabus(jobId);

  if (!incomingPyqs && !incomingSyllabus) {
    throw new WriterProcessingError(
      "PRODUCTION_JSON_MISSING",
      "production-pyqs.json / production-syllabus.json not found."
    );
  }

  const startedAt = new Date().toISOString();
  const jobDir = getJobDirectory(jobId);
  const contentDir = getSubjectContentDir({
    branch: metadata.branch,
    semester: metadata.semester,
    subjectCode: metadata.subjectCode,
  });
  const backupDir = path.join(jobDir, "backup");

  writerInFlight.add(jobId);

  try {
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.WRITING,
      error: null,
    });

    const logStartedAt = await logStageStart({
      jobId,
      stage: "writer",
      details: {
        branch: metadata.branch,
        semester: metadata.semester,
        subjectCode: metadata.subjectCode,
      },
    });

    try {
      const storedValidation = await readValidationReport(jobId);
      const jobDiagramPaths = await collectJobRelativePaths(jobDir);

      const preValidation =
        storedValidation ??
        validateForWrite({
          pyqs: incomingPyqs,
          syllabus: incomingSyllabus,
          existingPaths: jobDiagramPaths,
          pyqsPath: incomingPyqs ? "production-pyqs.json" : null,
          syllabusPath: incomingSyllabus ? "production-syllabus.json" : null,
          contract: "incoming",
        });

      if (preValidation.status === "FAILED") {
        const failedReport = buildWriteReport({
          status: "FAILED",
          writtenAt: new Date().toISOString(),
          durationMs: Date.now() - Date.parse(startedAt),
          contentDir: null,
          filesCreated: [],
          filesModified: [],
          papersAdded: 0,
          questionsAdded: 0,
          subQuestionsAdded: 0,
          modulesAdded: 0,
          topicsAdded: 0,
          attachmentsCopied: 0,
          attachmentsSkipped: 0,
          diagrams: createEmptyDiagramStats(),
          backupsCreated: [],
          warnings: preValidation.warnings,
          errors: [
            createIssue({
              severity: "error",
              code: "PRE_WRITE_VALIDATION_FAILED",
              message: `Pre-write validation failed with ${preValidation.statistics.errorCount} error(s). Nothing was written.`,
              path: "validation",
              index: 1,
            }),
            ...preValidation.errors,
          ],
          preValidation,
          postValidation: null,
        });

        const summary = toWritingRunSummary(
          failedReport,
          startedAt,
          CMS_WRITE_REPORT_FILENAME
        );

        await persistWriteOutcome({
          jobId,
          report: failedReport,
          summary,
          stage: PipelineStage.VALIDATED,
          status: "queued",
          error:
            failedReport.errors[0]?.message ?? "Pre-write validation failed.",
        });

        const job = await requireJob(jobId);

        await logStageSuccess({
          jobId,
          stage: "writer",
          startedAt: logStartedAt,
          details: {
            status: "FAILED",
            reason: "pre-write-validation",
            errorCount: preValidation.statistics.errorCount,
          },
        });

        return {
          job: {
            ...job,
            stage: PipelineStage.VALIDATED,
            writing: summary,
          },
          summary,
          report: failedReport,
        };
      }

      const existingPyqs = await readJsonFile<ProductionPyqsJson>(
        path.join(contentDir, "pyqs.json")
      );
      const existingSyllabus = await readJsonFile<ProductionSyllabusJson>(
        path.join(contentDir, "syllabus.json")
      );

      const writeResult = await writeProductionContent({
        jobId,
        jobDir,
        contentDir,
        backupDir,
        incomingPyqs,
        incomingSyllabus,
        existingPyqs,
        existingSyllabus,
        existingPyqsPath: existingPyqs ? "pyqs.json" : null,
        existingSyllabusPath: existingSyllabus ? "syllabus.json" : null,
        preValidation,
        mode: "preview",
      });

      const mergeStartedAt = await logStageStart({
        jobId,
        stage: "merge",
        details: {
          hadExistingPyqs: Boolean(existingPyqs),
          hadExistingSyllabus: Boolean(existingSyllabus),
          existingPaperCount: existingPyqs?.papers.length ?? 0,
          incomingPaperCount: incomingPyqs?.papers.length ?? 0,
          incomingIdentities:
            incomingPyqs?.papers.map(
              (paper) => `${paper.year}-${paper.month}`
            ) ?? [],
        },
      });
      await logStageSuccess({
        jobId,
        stage: "merge",
        startedAt: mergeStartedAt,
        details: {
          papersAdded: writeResult.report.papersAdded,
          questionsAdded: writeResult.report.questionsAdded,
          subQuestionsAdded: writeResult.report.subQuestionsAdded,
          status: writeResult.report.status,
          postMergeValidation:
            writeResult.report.postValidation?.status ?? null,
          errorCount: writeResult.report.errors.length,
          firstErrorCode: writeResult.report.errors[0]?.code ?? null,
          firstErrorPath: writeResult.report.errors[0]?.path ?? null,
        },
      });

      const report = writeResult.report;

      if (writeResult.pendingPyqs) {
        await writeJsonAtomic(
          path.join(jobDir, CMS_PENDING_PYQS_FILENAME),
          writeResult.pendingPyqs
        );
      }

      if (writeResult.pendingSyllabus) {
        await writeJsonAtomic(
          path.join(jobDir, CMS_PENDING_SYLLABUS_FILENAME),
          writeResult.pendingSyllabus
        );
      }

      const summary = toWritingRunSummary(
        report,
        startedAt,
        CMS_WRITE_REPORT_FILENAME
      );

      if (report.status === "FAILED") {
        await persistWriteOutcome({
          jobId,
          report,
          summary,
          stage: PipelineStage.VALIDATED,
          status: "queued",
          error: `POST_MERGE_VALIDATION_FAILED (${report.errors.length}): ${
            report.errors[0]
              ? `${report.errors[0].code}${
                  report.errors[0].path ? ` at ${report.errors[0].path}` : ""
                }: ${report.errors[0].message}`
              : "unknown error"
          }. Nothing was written.`,
        });

        const job = await requireJob(jobId);
        await logStageSuccess({
          jobId,
          stage: "writer",
          startedAt: logStartedAt,
          details: {
            status: "FAILED",
            reason: "post-merge-validation",
            errorCount: report.errors.length,
          },
        });
        return {
          job: {
            ...job,
            stage: PipelineStage.VALIDATED,
            writing: summary,
          },
          summary,
          report,
        };
      }

      await persistWriteOutcome({
        jobId,
        report,
        summary,
        stage: PipelineStage.WRITTEN,
        status: "queued",
        error: null,
      });

      const job = await requireJob(jobId);

      await logStageSuccess({
        jobId,
        stage: "writer",
        startedAt: logStartedAt,
        details: {
          status: report.status,
          papersAdded: report.papersAdded,
          questionsAdded: report.questionsAdded,
        },
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.WRITTEN,
          status: "queued",
          writing: summary,
        },
        summary,
        report,
      };
    } catch (error) {
      const normalized =
        error instanceof MergeMetadataError ||
        error instanceof WriterProcessingError
          ? error
          : asPipelineError(error, "MERGE");

      await logStageFailure({
        jobId,
        stage: "writer",
        startedAt: logStartedAt,
        error: normalized,
      });

      const message =
        normalized instanceof Error
          ? normalized.message
          : "Writer service failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof WriterProcessingError) {
        throw error;
      }

      throw new WriterProcessingError(
        normalized instanceof MergeMetadataError
          ? normalized.code
          : "WRITE_FAILED",
        message
      );
    }
  } finally {
    writerInFlight.delete(jobId);
  }
}

async function persistWriteOutcome(input: {
  jobId: string;
  report: WriteReport;
  summary: WritingRunSummary;
  stage: typeof PipelineStage.WRITTEN | typeof PipelineStage.VALIDATED;
  status: "queued";
  error: string | null;
}): Promise<void> {
  const completedAt = input.report.writtenAt;

  await writeJsonAtomic(getWriteReportPath(input.jobId), input.report);

  await updateJobStatus(input.jobId, input.status, {
    stage: input.stage,
    error: input.error,
  });

  const latestMetadata = await readJobMetadata(input.jobId);
  const latestPipeline = await readPipelineState(input.jobId);

  if (latestMetadata) {
    await updateJobMetadata({
      ...latestMetadata,
      stage: input.stage,
      status: input.status,
      updatedAt: completedAt,
      error: input.error,
    });
  }

  if (latestPipeline) {
    await updatePipelineState({
      ...latestPipeline,
      stage: input.stage,
      status: input.status,
      updatedAt: completedAt,
      error: input.error,
      writing: input.summary,
    });
  }
}

async function requireJob(jobId: string): Promise<ImportJobRecord> {
  const job = await getJob(jobId);
  if (!job) {
    throw new WriterProcessingError(
      "JOB_HYDRATION_FAILED",
      "Writer finished but the job could not be reloaded."
    );
  }
  return job;
}

async function collectJobRelativePaths(jobDir: string): Promise<Set<string>> {
  const paths = new Set<string>();

  async function walk(currentDir: string, relativePrefix: string) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relative = relativePrefix
        ? `${relativePrefix}/${entry.name}`
        : entry.name;
      const absolute = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        paths.add(relative.replace(/\\/g, "/"));
      }
    }
  }

  await walk(jobDir, "");
  return paths;
}
