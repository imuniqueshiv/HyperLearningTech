import fs from "fs/promises";
import path from "path";

import { CMS_RAW_DOCUMENT_FILENAME } from "./constants";
import { loadSessionDocuments } from "./document-loader";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { createDefaultOcrEngine } from "./local-ocr-engine";
import type { OcrEngine } from "./ocr-engine";
import { PipelineStage } from "./pipeline-stage";
import type { ImportJobRecord, UploadJobMetadata } from "./types";
import type { OcrRunSummary, RawDocument } from "./raw-document";
import {
  applyHighConfidenceMetadata,
  extractMetadata,
  loadSubjectCatalog,
  type ExtractedImportMetadata,
} from "./metadata-extractor";
import { assertOcrDocumentUsable, OcrQualityError } from "./ocr-quality";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { getJobDirectory } from "./temp-storage";

export class OcrProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OcrProcessingError";
    this.code = code;
  }
}

export interface RunOcrResult {
  job: ImportJobRecord;
  summary: OcrRunSummary;
  rawDocument: RawDocument;
}

/** In-process concurrency guard — must NOT persist across crashes (unlike disk stage). */
const ocrInFlight = new Set<string>();

/**
 * Absolute path to raw-document.json for a job.
 */
export function getRawDocumentPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_RAW_DOCUMENT_FILENAME);
}

/**
 * Writes RawDocument JSON into the job workspace.
 */
export async function writeRawDocument(
  jobId: string,
  document: RawDocument
): Promise<string> {
  const absolutePath = getRawDocumentPath(jobId);
  await fs.writeFile(
    absolutePath,
    JSON.stringify(document, null, 2) + "\n",
    "utf8"
  );
  return absolutePath;
}

/**
 * Reads raw-document.json when present.
 */
export async function readRawDocument(
  jobId: string
): Promise<RawDocument | null> {
  try {
    const raw = await fs.readFile(getRawDocumentPath(jobId), "utf8");
    return JSON.parse(raw) as RawDocument;
  } catch {
    return null;
  }
}

/**
 * Runs OCR extraction for a queued/OCR-ready import job.
 * Advances: QUEUED → OCR_PROCESSING → OCR_COMPLETED
 * Does not call Gemini or write into content/.
 */
export async function runOcrForJob(
  jobId: string,
  engine: OcrEngine = createDefaultOcrEngine()
): Promise<RunOcrResult> {
  if (ocrInFlight.has(jobId)) {
    throw new OcrProcessingError(
      "OCR_IN_PROGRESS",
      "OCR is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new OcrProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  // OCR_PROCESSING on disk is a stale crash marker and is recoverable.
  if (
    currentStage !== PipelineStage.QUEUED &&
    currentStage !== PipelineStage.UPLOADED &&
    currentStage !== PipelineStage.OCR_PROCESSING &&
    currentStage !== PipelineStage.OCR_COMPLETED &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new OcrProcessingError(
      "OCR_NOT_READY",
      `OCR cannot start from stage ${currentStage}.`
    );
  }

  const startedAt = new Date().toISOString();
  ocrInFlight.add(jobId);

  try {
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.OCR_PROCESSING,
      error: null,
    });

    const logStartedAt = await logStageStart({
      jobId,
      stage: "ocr",
      details: { originalFilename: metadata.originalFilename },
    });

    const jobDir = metadata.temporaryPath || getJobDirectory(jobId);

    try {
      const documents = await loadSessionDocuments(metadata);
      const document = documents[0];
      if (!document) {
        throw new OcrProcessingError(
          "SOURCE_MISSING",
          "No source documents found for this Import Session."
        );
      }

      const rawDocument = await engine.extract({
        jobId,
        jobDir,
        document,
        documents,
      });

      // #region agent log
      fetch(
        "http://127.0.0.1:7856/ingest/77f3b736-2f6d-4973-acf6-79f9a796e05e",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "26e666",
          },
          body: JSON.stringify({
            sessionId: "26e666",
            runId: "forensic-ocr",
            hypothesisId: "H3",
            location: "ocr-service.ts:afterExtract",
            message: "OCR engine result summary",
            data: {
              jobId,
              kind: document.kind,
              mimeType: document.mimeType,
              pageCount: rawDocument.metadata.pageCount,
              textBlockCount: rawDocument.metadata.textBlockCount,
              imageCount: rawDocument.metadata.imageCount,
              engine: rawDocument.metadata.engine,
              emptyPages: rawDocument.pages.filter((p) => !p.text).length,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion

      await writeRawDocument(jobId, rawDocument);
      const ocrQuality = assertOcrDocumentUsable(rawDocument);
      const extractedMetadata = await extractAndApplyJobMetadata(
        metadata,
        rawDocument
      );

      const completedAt = new Date().toISOString();
      const summary: OcrRunSummary = {
        startedAt,
        completedAt,
        durationMs: rawDocument.metadata.durationMs,
        pageCount: rawDocument.metadata.pageCount,
        imageCount: rawDocument.metadata.imageCount,
        tableCount: rawDocument.metadata.tableCount,
        textBlockCount: rawDocument.metadata.textBlockCount,
        engine: rawDocument.metadata.engine,
        rawDocumentPath: CMS_RAW_DOCUMENT_FILENAME,
      };

      // Re-queue for future structuring while marking OCR complete.
      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.OCR_COMPLETED,
        error: null,
      });

      const latestMetadata = await readJobMetadata(jobId);
      const latestPipeline = await readPipelineState(jobId);

      if (latestMetadata) {
        await updateJobMetadata({
          ...latestMetadata,
          ...extractedMetadata.applied,
          extractedMetadata: extractedMetadata.extracted,
          stage: PipelineStage.OCR_COMPLETED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
        });
      }

      if (latestPipeline) {
        await updatePipelineState({
          ...latestPipeline,
          stage: PipelineStage.OCR_COMPLETED,
          status: "queued",
          updatedAt: completedAt,
          error: null,
          ocr: summary,
        });
      }

      const job = await getJob(jobId);

      if (!job) {
        throw new OcrProcessingError(
          "JOB_HYDRATION_FAILED",
          "OCR finished but the job could not be reloaded."
        );
      }

      await logStageSuccess({
        jobId,
        stage: "ocr",
        startedAt: logStartedAt,
        details: {
          pageCount: summary.pageCount,
          textBlockCount: summary.textBlockCount,
          engine: summary.engine,
          totalChars: ocrQuality.totalChars,
          usablePageCount: ocrQuality.usablePageCount,
        },
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.OCR_COMPLETED,
          status: "queued",
          ocr: summary,
        },
        summary,
        rawDocument,
      };
    } catch (error) {
      await logStageFailure({
        jobId,
        stage: "ocr",
        startedAt: logStartedAt,
        error,
      });

      const message =
        error instanceof Error ? error.message : "OCR extraction failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof OcrProcessingError) {
        throw error;
      }

      if (error instanceof OcrQualityError) {
        throw new OcrProcessingError(error.code, error.message);
      }

      throw new OcrProcessingError("OCR_FAILED", message);
    }
  } finally {
    ocrInFlight.delete(jobId);
  }
}

async function extractAndApplyJobMetadata(
  metadata: UploadJobMetadata,
  rawDocument: RawDocument
): Promise<{
  extracted: ExtractedImportMetadata;
  applied: Pick<
    UploadJobMetadata,
    "branch" | "semester" | "subjectCode" | "year" | "examSession"
  >;
}> {
  const ocrText = rawDocument.pages.map((page) => page.text).join("\n");
  let catalog: Awaited<ReturnType<typeof loadSubjectCatalog>> = [];
  try {
    catalog = await loadSubjectCatalog();
  } catch {
    catalog = [];
  }

  const extracted = extractMetadata({
    filename: metadata.originalFilename,
    ocrText,
    catalog,
    overrides: {
      branch: metadata.manualOverrides?.branch ? metadata.branch : null,
      semester: metadata.manualOverrides?.semester ? metadata.semester : null,
      subjectCode: metadata.manualOverrides?.subjectCode
        ? metadata.subjectCode
        : null,
      year: metadata.manualOverrides?.year ? metadata.year : null,
      examSession: metadata.manualOverrides?.examSession
        ? metadata.examSession
        : null,
    },
  });

  const applied = applyHighConfidenceMetadata(
    {
      branch: metadata.branch,
      semester: metadata.semester,
      subjectCode: metadata.subjectCode,
      year: metadata.year,
      examSession: metadata.examSession,
    },
    extracted,
    metadata.manualOverrides
  );

  return { extracted, applied };
}
