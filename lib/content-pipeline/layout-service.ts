import fs from "fs/promises";
import path from "path";

import { CMS_STRUCTURED_DOCUMENT_FILENAME } from "./constants";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { detectLayout } from "./layout-detector";
import { PipelineStage } from "./pipeline-stage";
import { readRawDocument } from "./ocr-service";
import type { ImportJobRecord } from "./types";
import type {
  LayoutRunSummary,
  StructuredDocument,
} from "./structured-document";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { getJobDirectory } from "./temp-storage";

export class LayoutProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "LayoutProcessingError";
    this.code = code;
  }
}

export interface RunLayoutResult {
  job: ImportJobRecord;
  summary: LayoutRunSummary;
  structuredDocument: StructuredDocument;
}

/** In-process concurrency guard — must NOT persist across crashes (unlike disk stage). */
const layoutInFlight = new Set<string>();

function layoutLog(message: string, data?: Record<string, unknown>): void {
  const suffix = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[Layout] ${message}${suffix}`);
}

export function getStructuredDocumentPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_STRUCTURED_DOCUMENT_FILENAME);
}

export async function writeStructuredDocument(
  jobId: string,
  document: StructuredDocument
): Promise<string> {
  const absolutePath = getStructuredDocumentPath(jobId);
  await fs.writeFile(
    absolutePath,
    JSON.stringify(document, null, 2) + "\n",
    "utf8"
  );
  return absolutePath;
}

export async function readStructuredDocument(
  jobId: string
): Promise<StructuredDocument | null> {
  try {
    const raw = await fs.readFile(getStructuredDocumentPath(jobId), "utf8");
    return JSON.parse(raw) as StructuredDocument;
  } catch {
    return null;
  }
}

/**
 * Runs layout detection for a job with OCR_COMPLETED (or re-runnable) stage.
 * Advances: OCR_COMPLETED → LAYOUT_PROCESSING → LAYOUT_COMPLETED
 */
export async function runLayoutForJob(jobId: string): Promise<RunLayoutResult> {
  layoutLog("Start", { jobId });

  if (layoutInFlight.has(jobId)) {
    layoutLog("Blocked — already in-flight in this process", { jobId });
    throw new LayoutProcessingError(
      "LAYOUT_IN_PROGRESS",
      "Layout detection is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new LayoutProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;
  layoutLog("Stage check", { jobId, currentStage });

  // LAYOUT_PROCESSING on disk is treated as a stale crash marker and is
  // recoverable. True concurrency is guarded by layoutInFlight above.
  if (
    currentStage !== PipelineStage.OCR_COMPLETED &&
    currentStage !== PipelineStage.LAYOUT_PROCESSING &&
    currentStage !== PipelineStage.LAYOUT_COMPLETED &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new LayoutProcessingError(
      "OCR_REQUIRED",
      "Layout detection requires OCR_COMPLETED first."
    );
  }

  layoutLog("Reading raw-document.json", { jobId });
  const rawReadStarted = Date.now();
  const rawDocument = await readRawDocument(jobId);
  layoutLog("raw-document.json read finished", {
    jobId,
    ms: Date.now() - rawReadStarted,
    found: Boolean(rawDocument),
  });

  if (!rawDocument) {
    throw new LayoutProcessingError(
      "RAW_DOCUMENT_MISSING",
      "raw-document.json not found. Run OCR first."
    );
  }

  const startedAt = new Date().toISOString();
  layoutInFlight.add(jobId);

  try {
    layoutLog("Updating stage → LAYOUT_PROCESSING", { jobId });
    const statusStarted = Date.now();
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.LAYOUT_PROCESSING,
      error: null,
    });
    layoutLog("Stage update finished", {
      jobId,
      ms: Date.now() - statusStarted,
    });

    const logStartedAt = await logStageStart({ jobId, stage: "layout" });

    try {
      layoutLog("Detection started", {
        jobId,
        pageCount: rawDocument.pages.length,
        textBlockCount: rawDocument.metadata.textBlockCount,
      });
      const detectStarted = Date.now();
      const structuredDocument = detectLayout(rawDocument);
      layoutLog("Detection finished", {
        jobId,
        ms: Date.now() - detectStarted,
        sectionCount: structuredDocument.metadata.sectionCount,
        questionCount: structuredDocument.metadata.questionCount,
      });

      layoutLog("Writing structured-document.json", { jobId });
      const writeStarted = Date.now();
      await writeStructuredDocument(jobId, structuredDocument);
      layoutLog("structured-document.json written", {
        jobId,
        ms: Date.now() - writeStarted,
      });

      const completedAt = new Date().toISOString();
      const summary: LayoutRunSummary = {
        startedAt,
        completedAt,
        durationMs: structuredDocument.metadata.durationMs,
        pageCount: structuredDocument.metadata.pageCount,
        sectionCount: structuredDocument.metadata.sectionCount,
        questionCount: structuredDocument.metadata.questionCount,
        subQuestionCount: structuredDocument.metadata.subQuestionCount,
        figureCount: structuredDocument.metadata.figureCount,
        tableCount: structuredDocument.metadata.tableCount,
        captionCount: structuredDocument.metadata.captionCount,
        detector: structuredDocument.metadata.detector,
        structuredDocumentPath: CMS_STRUCTURED_DOCUMENT_FILENAME,
      };

      layoutLog("Updating stage → LAYOUT_COMPLETED", { jobId });
      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.LAYOUT_COMPLETED,
        error: null,
      });

      const latestMetadata = await readJobMetadata(jobId);
      const latestPipeline = await readPipelineState(jobId);

      if (latestMetadata) {
        await updateJobMetadata({
          ...latestMetadata,
          stage: PipelineStage.LAYOUT_COMPLETED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
        });
      }

      if (latestPipeline) {
        await updatePipelineState({
          ...latestPipeline,
          stage: PipelineStage.LAYOUT_COMPLETED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
          layout: summary,
        });
      }

      const job = await getJob(jobId);

      if (!job) {
        throw new LayoutProcessingError(
          "JOB_HYDRATION_FAILED",
          "Layout finished but the job could not be reloaded."
        );
      }

      await logStageSuccess({
        jobId,
        stage: "layout",
        startedAt: logStartedAt,
        details: {
          questionCount: summary.questionCount,
          figureCount: summary.figureCount,
        },
      });

      layoutLog("Complete", {
        jobId,
        durationMs: summary.durationMs,
        pageCount: summary.pageCount,
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.LAYOUT_COMPLETED,
          status: "queued",
          layout: summary,
        },
        summary,
        structuredDocument,
      };
    } catch (error) {
      layoutLog("Failed", {
        jobId,
        error: error instanceof Error ? error.message : String(error),
      });

      await logStageFailure({
        jobId,
        stage: "layout",
        startedAt: logStartedAt,
        error,
      });

      const message =
        error instanceof Error ? error.message : "Layout detection failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof LayoutProcessingError) {
        throw error;
      }

      throw new LayoutProcessingError("LAYOUT_FAILED", message);
    }
  } finally {
    layoutInFlight.delete(jobId);
    layoutLog("In-flight cleared", { jobId });
  }
}
