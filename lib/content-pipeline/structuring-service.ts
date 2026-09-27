import fs from "fs/promises";
import path from "path";

import { CMS_ACADEMIC_DOCUMENT_FILENAME } from "./constants";
import type {
  AcademicDocument,
  StructuringRunSummary,
} from "./academic-document";
import { toStructuringSummary } from "./academic-parser";
import {
  createDefaultStructuringEngine,
  type StructuringEngine,
} from "./gemini-structuring";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { readStructuredDocument } from "./layout-service";
import { PipelineStage } from "./pipeline-stage";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { getJobDirectory } from "./temp-storage";
import { readRawDocument } from "./ocr-service";
import { MIN_USABLE_DOCUMENT_CHARS, pageTextCharCount } from "./ocr-quality";
import { CMS_ERROR_CODES } from "./pipeline-errors";
import type { ImportJobRecord } from "./types";

export class StructuringProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "StructuringProcessingError";
    this.code = code;
  }
}

export interface RunStructuringResult {
  job: ImportJobRecord;
  summary: StructuringRunSummary;
  academicDocument: AcademicDocument;
}

/** In-process concurrency guard — must NOT persist across crashes. */
const structuringInFlight = new Set<string>();

export function getAcademicDocumentPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_ACADEMIC_DOCUMENT_FILENAME);
}

export async function writeAcademicDocument(
  jobId: string,
  document: AcademicDocument
): Promise<string> {
  const absolutePath = getAcademicDocumentPath(jobId);
  await fs.writeFile(
    absolutePath,
    JSON.stringify(document, null, 2) + "\n",
    "utf8"
  );
  return absolutePath;
}

export async function readAcademicDocument(
  jobId: string
): Promise<AcademicDocument | null> {
  try {
    const raw = await fs.readFile(getAcademicDocumentPath(jobId), "utf8");
    return JSON.parse(raw) as AcademicDocument;
  } catch {
    return null;
  }
}

/**
 * Runs Gemini structuring after diagrams are ready.
 * Advances: DIAGRAMS_READY → STRUCTURING → STRUCTURED
 */
export async function runStructuringForJob(
  jobId: string,
  engine: StructuringEngine = createDefaultStructuringEngine()
): Promise<RunStructuringResult> {
  if (structuringInFlight.has(jobId)) {
    throw new StructuringProcessingError(
      "STRUCTURING_IN_PROGRESS",
      "Gemini structuring is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new StructuringProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  // STRUCTURING on disk is a stale crash marker and is recoverable.
  if (
    currentStage !== PipelineStage.DIAGRAMS_READY &&
    currentStage !== PipelineStage.STRUCTURING &&
    currentStage !== PipelineStage.STRUCTURED &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new StructuringProcessingError(
      "DIAGRAMS_REQUIRED",
      "Structuring requires DIAGRAMS_READY first."
    );
  }

  const structuredDocument = await readStructuredDocument(jobId);

  if (!structuredDocument) {
    throw new StructuringProcessingError(
      "STRUCTURED_DOCUMENT_MISSING",
      "structured-document.json not found. Run layout and diagram extraction first."
    );
  }

  const startedAt = new Date().toISOString();
  structuringInFlight.add(jobId);

  try {
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.STRUCTURING,
      error: null,
    });

    const logStartedAt = await logStageStart({
      jobId,
      stage: "structuring",
      details: { jobType: metadata.type, subjectCode: metadata.subjectCode },
    });

    try {
      const result = await engine.structure({
        jobId,
        jobType: metadata.type,
        branch: metadata.branch,
        semester: metadata.semester,
        subjectCode: metadata.subjectCode,
        sourceFilename: metadata.originalFilename,
        document: structuredDocument,
      });

      await writeAcademicDocument(jobId, result.academicDocument);

      if (metadata.type === "pyq") {
        const rawDocument = await readRawDocument(jobId);
        const ocrChars = (rawDocument?.pages ?? []).reduce(
          (sum, page) => sum + pageTextCharCount(page.text, page.textBlocks),
          0
        );
        if (
          result.academicDocument.questions.length === 0 &&
          ocrChars >= MIN_USABLE_DOCUMENT_CHARS
        ) {
          throw new StructuringProcessingError(
            CMS_ERROR_CODES.GEMINI_EMPTY_OUTPUT,
            `Gemini returned questions: [] while OCR contains ${ocrChars} characters. This is a structuring failure, not an empty paper.`
          );
        }
      }

      const completedAt = new Date().toISOString();
      const summary = toStructuringSummary(result.academicDocument, {
        startedAt,
        completedAt,
        durationMs: Date.parse(completedAt) - Date.parse(startedAt),
        academicDocumentPath: CMS_ACADEMIC_DOCUMENT_FILENAME,
      });

      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.STRUCTURED,
        error: null,
      });

      const latestMetadata = await readJobMetadata(jobId);
      const latestPipeline = await readPipelineState(jobId);

      if (latestMetadata) {
        await updateJobMetadata({
          ...latestMetadata,
          stage: PipelineStage.STRUCTURED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
        });
      }

      if (latestPipeline) {
        await updatePipelineState({
          ...latestPipeline,
          stage: PipelineStage.STRUCTURED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
          structuring: summary,
        });
      }

      const job = await getJob(jobId);

      if (!job) {
        throw new StructuringProcessingError(
          "JOB_HYDRATION_FAILED",
          "Structuring finished but the job could not be reloaded."
        );
      }

      await logStageSuccess({
        jobId,
        stage: "structuring",
        startedAt: logStartedAt,
        details: {
          questionCount: summary.questionCount,
          diagramCount: summary.diagramCount,
        },
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.STRUCTURED,
          status: "queued",
          structuring: summary,
        },
        summary,
        academicDocument: result.academicDocument,
      };
    } catch (error) {
      await logStageFailure({
        jobId,
        stage: "structuring",
        startedAt: logStartedAt,
        error,
      });

      const message =
        error instanceof Error ? error.message : "Gemini structuring failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof StructuringProcessingError) {
        throw error;
      }

      throw new StructuringProcessingError("STRUCTURING_FAILED", message);
    }
  } finally {
    structuringInFlight.delete(jobId);
  }
}
