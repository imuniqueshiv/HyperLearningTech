import fs from "fs/promises";
import path from "path";

import type { AcademicDocument } from "./academic-document";
import {
  CMS_PRODUCTION_PYQS_FILENAME,
  CMS_PRODUCTION_SYLLABUS_FILENAME,
} from "./constants";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import { buildProductionSchemas } from "./schema-builder";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  SchemaBuildRunSummary,
} from "./schema-types";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { asPipelineError } from "./string-normalize";
import { readAcademicDocument } from "./structuring-service";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord, UploadJobMetadata } from "./types";

export class SchemaBuildProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SchemaBuildProcessingError";
    this.code = code;
  }
}

export interface RunSchemaBuildResult {
  job: ImportJobRecord;
  summary: SchemaBuildRunSummary;
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
}

const schemaInFlight = new Set<string>();

export function getProductionPyqsPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_PRODUCTION_PYQS_FILENAME);
}

export function getProductionSyllabusPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_PRODUCTION_SYLLABUS_FILENAME);
}

export async function readProductionPyqs(
  jobId: string
): Promise<ProductionPyqsJson | null> {
  try {
    const raw = await fs.readFile(getProductionPyqsPath(jobId), "utf8");
    return JSON.parse(raw) as ProductionPyqsJson;
  } catch {
    return null;
  }
}

export async function readProductionSyllabus(
  jobId: string
): Promise<ProductionSyllabusJson | null> {
  try {
    const raw = await fs.readFile(getProductionSyllabusPath(jobId), "utf8");
    return JSON.parse(raw) as ProductionSyllabusJson;
  } catch {
    return null;
  }
}

/**
 * Builds production preview JSON from AcademicDocument.
 * Advances: STRUCTURED → SCHEMA_BUILDING → SCHEMA_READY
 */
export async function runSchemaBuildForJob(
  jobId: string
): Promise<RunSchemaBuildResult> {
  if (schemaInFlight.has(jobId)) {
    throw new SchemaBuildProcessingError(
      "SCHEMA_BUILD_IN_PROGRESS",
      "Schema building is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new SchemaBuildProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  if (
    currentStage !== PipelineStage.STRUCTURED &&
    currentStage !== PipelineStage.SCHEMA_BUILDING &&
    currentStage !== PipelineStage.SCHEMA_READY &&
    currentStage !== PipelineStage.VALIDATED &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new SchemaBuildProcessingError(
      "STRUCTURED_REQUIRED",
      "Schema building requires STRUCTURED first."
    );
  }

  const academicDocument = await readAcademicDocument(jobId);

  if (!academicDocument) {
    throw new SchemaBuildProcessingError(
      "ACADEMIC_DOCUMENT_MISSING",
      "academic-document.json not found. Run Gemini structuring first."
    );
  }

  const startedAt = new Date().toISOString();
  schemaInFlight.add(jobId);

  try {
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.SCHEMA_BUILDING,
      error: null,
    });

    const logStartedAt = await logStageStart({ jobId, stage: "schema" });

    try {
      const enriched = applySessionExamHints(academicDocument, metadata);
      const built = buildProductionSchemas(enriched);
      const jobDir = getJobDirectory(jobId);

      let pyqsPath: string | null = null;
      let syllabusPath: string | null = null;

      if (built.pyqs) {
        pyqsPath = CMS_PRODUCTION_PYQS_FILENAME;
        await fs.writeFile(
          path.join(jobDir, pyqsPath),
          JSON.stringify(built.pyqs, null, 2) + "\n",
          "utf8"
        );
      }

      if (built.syllabus) {
        syllabusPath = CMS_PRODUCTION_SYLLABUS_FILENAME;
        await fs.writeFile(
          path.join(jobDir, syllabusPath),
          JSON.stringify(built.syllabus, null, 2) + "\n",
          "utf8"
        );
      }

      const completedAt = new Date().toISOString();
      const summary: SchemaBuildRunSummary = {
        startedAt,
        completedAt,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
        questionCount: built.questionCount,
        subQuestionCount: built.subQuestionCount,
        moduleCount: built.moduleCount,
        topicCount: built.topicCount,
        diagramCount: built.diagramCount,
        pyqsPath,
        syllabusPath,
      };

      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.SCHEMA_READY,
        error: null,
      });

      const latestMetadata = await readJobMetadata(jobId);
      const latestPipeline = await readPipelineState(jobId);

      if (latestMetadata) {
        await updateJobMetadata({
          ...latestMetadata,
          stage: PipelineStage.SCHEMA_READY,
          status: "queued",
          updatedAt: completedAt,
          error: null,
        });
      }

      if (latestPipeline) {
        await updatePipelineState({
          ...latestPipeline,
          stage: PipelineStage.SCHEMA_READY,
          status: "queued",
          updatedAt: completedAt,
          error: null,
          schema: summary,
        });
      }

      const job = await getJob(jobId);

      if (!job) {
        throw new SchemaBuildProcessingError(
          "JOB_HYDRATION_FAILED",
          "Schema build finished but the job could not be reloaded."
        );
      }

      await logStageSuccess({
        jobId,
        stage: "schema",
        startedAt: logStartedAt,
        details: {
          questionCount: summary.questionCount,
          subQuestionCount: summary.subQuestionCount,
          moduleCount: summary.moduleCount,
        },
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.SCHEMA_READY,
          status: "queued",
          schema: summary,
        },
        summary,
        pyqs: built.pyqs,
        syllabus: built.syllabus,
      };
    } catch (error) {
      const normalized = asPipelineError(error, "Schema Builder");

      await logStageFailure({
        jobId,
        stage: "schema",
        startedAt: logStartedAt,
        error: normalized,
      });

      const message = normalized.message || "Schema building failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof SchemaBuildProcessingError) {
        throw error;
      }

      throw new SchemaBuildProcessingError("SCHEMA_BUILD_FAILED", message);
    }
  } finally {
    schemaInFlight.delete(jobId);
  }
}

/** Exposed for tests / future callers that already hold AcademicDocument. */
export function buildSchemasFromAcademic(
  document: AcademicDocument
): ReturnType<typeof buildProductionSchemas> {
  return buildProductionSchemas(document);
}

/**
 * Overlay admin-provided year / exam session onto Gemini output
 * without changing Gemini prompts.
 *
 * Invalid years (e.g. 1984 from a bad form value) must NEVER overwrite a
 * document year Gemini already extracted correctly. Only years in 2000–2099
 * are applied.
 */
export function applySessionExamHints(
  document: AcademicDocument,
  metadata: UploadJobMetadata
): AcademicDocument {
  const hasValidYear =
    typeof metadata.year === "number" &&
    Number.isFinite(metadata.year) &&
    metadata.year >= 2000 &&
    metadata.year <= 2099;
  const hasSession = Boolean(metadata.examSession);

  if (!hasValidYear && !hasSession) {
    return document;
  }

  const month = metadata.examSession ?? document.exam?.month ?? null;
  const year = hasValidYear ? metadata.year : (document.exam?.year ?? null);

  return {
    ...document,
    exam: {
      exam: document.exam?.exam ?? (month && year ? `${month} ${year}` : null),
      year,
      month,
      maxMarks: document.exam?.maxMarks ?? null,
      time: document.exam?.time ?? null,
      commonInstructions: document.exam?.commonInstructions ?? [],
      isPredicted: document.exam?.isPredicted ?? null,
      gradingSystem: document.exam?.gradingSystem ?? null,
    },
    metadata: {
      ...document.metadata,
      subjectCode: metadata.subjectCode || document.metadata.subjectCode,
      semester: metadata.semester || document.metadata.semester,
      branch: metadata.branch || document.metadata.branch,
    },
  };
}
