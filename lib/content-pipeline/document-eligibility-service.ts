/**
 * Document eligibility service — runs after OCR, before Gemini structuring.
 * Persists document-eligibility.json and fails closed on REJECTED.
 */

import path from "path";

import {
  eligibilityAllowsStructuring,
  evaluateDocumentEligibility,
  type DocumentEligibilityResult,
} from "./document-eligibility";
import { handleStageFailure } from "./failure-handler";
import { getJob, updateJobStatus } from "./import-queue";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";
import {
  readJobMetadata,
  updateJobMetadata,
  updatePipelineState,
  readPipelineState,
} from "./job-manager";
import { readRawDocument } from "./ocr-service";
import { PipelineStage } from "./pipeline-stage";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord } from "./types";

export const CMS_DOCUMENT_ELIGIBILITY_FILENAME = "document-eligibility.json";

export class DocumentEligibilityError extends Error {
  readonly code: string;
  readonly result: DocumentEligibilityResult;

  constructor(result: DocumentEligibilityResult) {
    super(result.summary);
    this.name = "DocumentEligibilityError";
    this.code = result.codes[0] ?? "DOCUMENT_ELIGIBILITY_REJECTED";
    this.result = result;
  }
}

export function getDocumentEligibilityPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_DOCUMENT_ELIGIBILITY_FILENAME);
}

export async function readDocumentEligibility(
  jobId: string
): Promise<DocumentEligibilityResult | null> {
  return readJsonFile<DocumentEligibilityResult>(
    getDocumentEligibilityPath(jobId)
  );
}

export async function writeDocumentEligibility(
  jobId: string,
  result: DocumentEligibilityResult
): Promise<void> {
  await writeJsonAtomic(getDocumentEligibilityPath(jobId), result);
}

/**
 * Evaluate raw OCR/native text and persist eligibility.
 * Throws DocumentEligibilityError when status is REJECTED (blocks Gemini).
 */
export async function runDocumentEligibilityForJob(jobId: string): Promise<{
  job: ImportJobRecord;
  result: DocumentEligibilityResult;
}> {
  const raw = await readRawDocument(jobId);
  if (!raw) {
    throw new DocumentEligibilityError(
      evaluateDocumentEligibility({ text: "", charCount: 0 })
    );
  }

  const pageTexts = raw.pages.map((p) => p.text ?? "");
  const fullText = pageTexts.join("\n\n");
  const charCount = pageTexts.reduce(
    (n, t) => n + t.replace(/\s+/g, "").length,
    0
  );

  const metadata = await readJobMetadata(jobId);
  const result = evaluateDocumentEligibility({
    text: fullText,
    pageTexts,
    charCount,
    filename: metadata?.originalFilename ?? raw.metadata.sourceFilename ?? null,
  });

  await writeDocumentEligibility(jobId, result);

  const concise = `INFO Document eligibility status=${result.status} institution=${result.institution} type=${result.documentType} confidence=${result.confidence}`;
  console.info(concise);

  if (!eligibilityAllowsStructuring(result)) {
    const message = `${result.adminTitle}: ${result.summary}`;
    await updateJobStatus(jobId, "failed", {
      stage: PipelineStage.FAILED,
      error: message,
    });
    const latest = await readJobMetadata(jobId);
    if (latest) {
      await updateJobMetadata({
        ...latest,
        stage: PipelineStage.FAILED,
        status: "failed",
        error: message,
        updatedAt: new Date().toISOString(),
      });
    }
    const pipeline = await readPipelineState(jobId);
    if (pipeline) {
      await updatePipelineState({
        ...pipeline,
        stage: PipelineStage.FAILED,
        status: "failed",
        error: message,
        updatedAt: new Date().toISOString(),
      });
    }
    await handleStageFailure({
      jobId,
      stage: PipelineStage.FAILED,
      reason: message,
    });
    throw new DocumentEligibilityError(result);
  }

  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job not found after eligibility: ${jobId}`);
  }
  return { job, result };
}

/**
 * Ensure eligibility was evaluated; re-run if missing. Used before Gemini.
 */
export async function requireDocumentEligibilityForStructuring(
  jobId: string
): Promise<DocumentEligibilityResult> {
  let existing = await readDocumentEligibility(jobId);
  if (!existing) {
    const ran = await runDocumentEligibilityForJob(jobId);
    existing = ran.result;
  }
  if (!eligibilityAllowsStructuring(existing)) {
    throw new DocumentEligibilityError(existing);
  }
  return existing;
}
