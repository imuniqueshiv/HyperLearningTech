import path from "path";

import {
  CMS_PENDING_PYQS_FILENAME,
  CMS_PENDING_SYLLABUS_FILENAME,
  CMS_PRODUCTION_PYQS_FILENAME,
  CMS_PRODUCTION_SYLLABUS_FILENAME,
  CMS_SAVE_REPORT_FILENAME,
  CMS_WRITE_REPORT_FILENAME,
} from "./constants";
import { handleStageFailure } from "./failure-handler";
import { writeHistoryFilesModified } from "./history-service";
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
import type { SaveReport, SaveRunSummary } from "./review-types";
import { rollbackLocalSave } from "./rollback-service";
import { getStorageProvider } from "./storage-factory";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
} from "./schema-types";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord } from "./types";
import { readValidationReport } from "./validation-service";
import { writeProductionContent } from "./writer";
import { getSubjectContentDir } from "./writer-service";

export class SaveProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SaveProcessingError";
    this.code = code;
  }
}

export interface RunLocalSaveResult {
  job: ImportJobRecord;
  summary: SaveRunSummary;
  report: SaveReport;
}

const saveInFlight = new Set<string>();

export function getSaveReportPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_SAVE_REPORT_FILENAME);
}

export async function readSaveReport(
  jobId: string
): Promise<SaveReport | null> {
  return readJsonFile<SaveReport>(getSaveReportPath(jobId));
}

/**
 * Commits approved pending JSON into content/rgpv/.
 * Advances: APPROVED → DIAGRAMS_WRITING → DIAGRAMS_WRITTEN → LOCAL_SAVED
 */
export async function runLocalSaveForJob(
  jobId: string
): Promise<RunLocalSaveResult> {
  if (saveInFlight.has(jobId)) {
    throw new SaveProcessingError(
      "SAVE_IN_PROGRESS",
      "Local save is already in progress."
    );
  }

  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new SaveProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const pipeline = await readPipelineState(jobId);
  const stage = pipeline?.stage ?? metadata.stage;

  // DIAGRAMS_WRITING may be a stale crash marker from a prior save attempt.
  if (
    stage !== PipelineStage.APPROVED &&
    stage !== PipelineStage.DIAGRAMS_WRITING &&
    stage !== PipelineStage.LOCAL_SAVED
  ) {
    throw new SaveProcessingError(
      "APPROVED_REQUIRED",
      "Local save requires APPROVED review decision first."
    );
  }

  if (!metadata.branch || !metadata.semester || !metadata.subjectCode) {
    throw new SaveProcessingError(
      "CONTENT_TARGET_REQUIRED",
      "Local save requires branch, semester, and subjectCode."
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

  saveInFlight.add(jobId);

  await updateJobStatus(jobId, "processing", {
    stage: PipelineStage.DIAGRAMS_WRITING,
    error: null,
  });

  try {
    const productionPyqs = await readJsonFile<ProductionPyqsJson>(
      path.join(jobDir, CMS_PRODUCTION_PYQS_FILENAME)
    );
    const productionSyllabus = await readJsonFile<ProductionSyllabusJson>(
      path.join(jobDir, CMS_PRODUCTION_SYLLABUS_FILENAME)
    );
    const pendingPyqs = await readJsonFile<ProductionPyqsJson>(
      path.join(jobDir, CMS_PENDING_PYQS_FILENAME)
    );
    const pendingSyllabus = await readJsonFile<ProductionSyllabusJson>(
      path.join(jobDir, CMS_PENDING_SYLLABUS_FILENAME)
    );

    if (
      !productionPyqs &&
      !productionSyllabus &&
      !pendingPyqs &&
      !pendingSyllabus
    ) {
      throw new SaveProcessingError(
        "PENDING_JSON_MISSING",
        "pending / production JSON not found for this job."
      );
    }

    const existingPyqs = await readJsonFile<ProductionPyqsJson>(
      path.join(contentDir, "pyqs.json")
    );
    const existingSyllabus = await readJsonFile<ProductionSyllabusJson>(
      path.join(contentDir, "syllabus.json")
    );

    const preValidation = await readValidationReport(jobId);

    // Use production (job-relative diagram paths) as incoming so Diagram Writer
    // can copy assets. Pending JSON (already merged / possibly edited) is
    // written afterward as the final content snapshot.
    const writeResult = await writeProductionContent({
      jobId,
      jobDir,
      contentDir,
      backupDir,
      incomingPyqs: productionPyqs ?? pendingPyqs,
      incomingSyllabus: productionSyllabus ?? pendingSyllabus,
      existingPyqs,
      existingSyllabus,
      existingPyqsPath: existingPyqs ? "pyqs.json" : null,
      existingSyllabusPath: existingSyllabus ? "syllabus.json" : null,
      preValidation,
      mode: "commit",
      onDiagramsWriting: async () => {
        await updateJobStatus(jobId, "processing", {
          stage: PipelineStage.DIAGRAMS_WRITING,
          error: null,
        });
      },
      onDiagramsWritten: async () => {
        await updateJobStatus(jobId, "processing", {
          stage: PipelineStage.DIAGRAMS_WRITTEN,
          error: null,
        });
      },
    });

    if (writeResult.report.status === "FAILED") {
      const failedReport: SaveReport = {
        status: "FAILED",
        savedAt: new Date().toISOString(),
        durationMs: Date.now() - Date.parse(startedAt),
        contentDir: toRepoRelative(contentDir),
        filesUpdated: [],
        filesCreated: [],
        diagramsCopied: 0,
        diagramsReused: 0,
        diagramsSkipped: 0,
        writeReportPath: null,
        errors: writeResult.report.errors.map((issue) => issue.message),
        warnings: writeResult.report.warnings.map((issue) => issue.message),
      };

      await writeJsonAtomic(getSaveReportPath(jobId), failedReport);

      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.APPROVED,
        error: `Local save validation failed with ${failedReport.errors.length} error(s).`,
      });

      const summary: SaveRunSummary = {
        startedAt,
        completedAt: failedReport.savedAt,
        durationMs: failedReport.durationMs,
        status: "FAILED",
        filesCreated: 0,
        filesUpdated: 0,
        diagramsCopied: 0,
        reportPath: CMS_SAVE_REPORT_FILENAME,
        contentDir: failedReport.contentDir,
      };

      const job = await requireJob(jobId);
      return { job: { ...job, save: summary }, summary, report: failedReport };
    }

    // Prefer approved pending snapshot (includes review edits).
    const storage = getStorageProvider();
    if (pendingPyqs) {
      await storage.saveJson(path.join(contentDir, "pyqs.json"), pendingPyqs);
    }
    if (pendingSyllabus) {
      await storage.saveJson(
        path.join(contentDir, "syllabus.json"),
        pendingSyllabus
      );
    }

    await writeJsonAtomic(
      path.join(jobDir, CMS_WRITE_REPORT_FILENAME),
      writeResult.report
    );

    const report: SaveReport = {
      status: "SUCCESS",
      savedAt: new Date().toISOString(),
      durationMs: Date.now() - Date.parse(startedAt),
      contentDir: toRepoRelative(contentDir),
      filesUpdated: writeResult.report.filesModified,
      filesCreated: writeResult.report.filesCreated,
      diagramsCopied: writeResult.report.diagrams.diagramsCopied,
      diagramsReused: writeResult.report.diagrams.diagramsReused,
      diagramsSkipped: writeResult.report.diagrams.diagramsSkipped,
      writeReportPath: CMS_WRITE_REPORT_FILENAME,
      errors: [],
      warnings: writeResult.report.warnings.map((issue) => issue.message),
    };

    await writeJsonAtomic(getSaveReportPath(jobId), report);

    const summary: SaveRunSummary = {
      startedAt,
      completedAt: report.savedAt,
      durationMs: report.durationMs,
      status: "SUCCESS",
      filesCreated: report.filesCreated.length,
      filesUpdated: report.filesUpdated.length,
      diagramsCopied: report.diagramsCopied,
      reportPath: CMS_SAVE_REPORT_FILENAME,
      contentDir: report.contentDir,
    };

    await updateJobStatus(jobId, "completed", {
      stage: PipelineStage.LOCAL_SAVED,
      error: null,
    });

    const latestMetadata = await readJobMetadata(jobId);
    const latestPipeline = await readPipelineState(jobId);

    if (latestMetadata) {
      await updateJobMetadata({
        ...latestMetadata,
        stage: PipelineStage.LOCAL_SAVED,
        status: "completed",
        updatedAt: report.savedAt,
        error: null,
      });
    }

    if (latestPipeline) {
      await updatePipelineState({
        ...latestPipeline,
        stage: PipelineStage.LOCAL_SAVED,
        status: "completed",
        updatedAt: report.savedAt,
        error: null,
        writing: {
          startedAt,
          completedAt: report.savedAt,
          durationMs: writeResult.report.durationMs,
          status: "SUCCESS",
          filesCreated: writeResult.report.filesCreated.length,
          filesModified: writeResult.report.filesModified.length,
          papersAdded: writeResult.report.papersAdded,
          questionsAdded: writeResult.report.questionsAdded,
          topicsAdded: writeResult.report.topicsAdded,
          attachmentsCopied: writeResult.report.attachmentsCopied,
          diagramsCopied: writeResult.report.diagrams.diagramsCopied,
          diagramsReused: writeResult.report.diagrams.diagramsReused,
          diagramsSkipped: writeResult.report.diagrams.diagramsSkipped,
          errorCount: 0,
          warningCount: writeResult.report.warnings.length,
          reportPath: CMS_WRITE_REPORT_FILENAME,
          manifestPath: writeResult.report.diagrams.manifestPath,
          contentDir: report.contentDir,
        },
        save: summary,
      });
    }

    const job = await requireJob(jobId);
    const result = {
      job: {
        ...job,
        stage: PipelineStage.LOCAL_SAVED,
        status: "completed" as const,
        save: summary,
      },
      summary,
      report,
    };

    try {
      await writeHistoryFilesModified(jobId, [
        ...report.filesCreated,
        ...report.filesUpdated,
      ]);
    } catch {
      // History is non-blocking.
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Local save failed.";

    try {
      await rollbackLocalSave(jobId);
    } catch {
      // Best-effort rollback from backup/.
    }

    await updateJobStatus(jobId, "failed", {
      stage: PipelineStage.FAILED,
      error: message,
    });

    try {
      await handleStageFailure({
        jobId,
        stage: PipelineStage.DIAGRAMS_WRITING,
        reason: message,
        error,
      });
    } catch {
      // Failure log is non-blocking.
    }

    if (error instanceof SaveProcessingError) {
      throw error;
    }

    throw new SaveProcessingError("SAVE_FAILED", message);
  } finally {
    saveInFlight.delete(jobId);
  }
}

async function requireJob(jobId: string): Promise<ImportJobRecord> {
  const job = await getJob(jobId);
  if (!job) {
    throw new SaveProcessingError(
      "JOB_HYDRATION_FAILED",
      "Local save finished but the job could not be reloaded."
    );
  }
  return job;
}

function toRepoRelative(absolutePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = absolutePath.replace(/\\/g, "/");
  if (normalized.startsWith(cwd + "/")) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}
