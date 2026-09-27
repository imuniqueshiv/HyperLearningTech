/**
 * Retry a failed pipeline stage without restarting from OCR.
 */

import { runDiagramsForJob } from "./diagram-service";
import { handleStageFailure } from "./failure-handler";
import { getJob } from "./import-queue";
import { runLayoutForJob } from "./layout-service";
import { runLocalSaveForJob } from "./local-save-service";
import { runOcrForJob } from "./ocr-service";
import { PipelineStage } from "./pipeline-stage";
import { startReviewForJob } from "./review-service";
import { runSchemaBuildForJob } from "./schema-builder-service";
import { runStructuringForJob } from "./structuring-service";
import type { ImportJobRecord } from "./types";
import { runValidationForJob } from "./validation-service";
import { runWriterForJob } from "./writer-service";

export class JobRecoveryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "JobRecoveryError";
    this.code = code;
  }
}

export type RecoverableStage =
  | "ocr"
  | "layout"
  | "diagrams"
  | "structuring"
  | "schema"
  | "validation"
  | "writer"
  | "review"
  | "save";

/**
 * Infers which stage to retry from job state.
 */
export function inferRetryStage(job: ImportJobRecord): RecoverableStage | null {
  if (
    job.stage === PipelineStage.FAILED ||
    job.stage === PipelineStage.TIMEOUT ||
    job.stage === PipelineStage.CANCELLED ||
    job.status === "failed"
  ) {
    if (!job.ocr) return "ocr";
    if (!job.layout) return "layout";
    if (!job.diagrams) return "diagrams";
    if (!job.structuring) return "structuring";
    if (!job.schema) return "schema";
    if (!job.validation) return "validation";
    if (!job.writing) return "writer";
    if (!job.review) return "review";
    if (!job.save) return "save";
    return "ocr";
  }

  // Allow explicit retry of the next incomplete stage from a healthy job.
  if (!job.ocr) return "ocr";
  if (!job.layout) return "layout";
  if (!job.diagrams) return "diagrams";
  if (!job.structuring) return "structuring";
  if (!job.schema) return "schema";
  if (!job.validation) return "validation";
  if (!job.writing) return "writer";
  if (
    job.stage === PipelineStage.WRITTEN ||
    job.stage === PipelineStage.UNDER_REVIEW
  ) {
    return "review";
  }
  if (job.stage === PipelineStage.APPROVED) return "save";
  return null;
}

export function stageLabelToPipelineStage(
  stage: RecoverableStage
): PipelineStage {
  switch (stage) {
    case "ocr":
      return PipelineStage.OCR_PROCESSING;
    case "layout":
      return PipelineStage.LAYOUT_PROCESSING;
    case "diagrams":
      return PipelineStage.DIAGRAM_EXTRACTION;
    case "structuring":
      return PipelineStage.STRUCTURING;
    case "schema":
      return PipelineStage.SCHEMA_BUILDING;
    case "validation":
      return PipelineStage.VALIDATING;
    case "writer":
      return PipelineStage.WRITING;
    case "review":
      return PipelineStage.UNDER_REVIEW;
    case "save":
      return PipelineStage.DIAGRAMS_WRITING;
  }
}

/**
 * Retries a single stage (or the inferred failed stage).
 * Never runs Writer after a failed validation.
 */
export async function retryFailedStage(input: {
  jobId: string;
  stage?: RecoverableStage | null;
}): Promise<{
  job: ImportJobRecord;
  stageRetried: RecoverableStage;
  message: string;
}> {
  const job = await getJob(input.jobId);
  if (!job) {
    throw new JobRecoveryError(
      "JOB_NOT_FOUND",
      `Job not found: ${input.jobId}`
    );
  }

  const stage = input.stage ?? inferRetryStage(job);
  if (!stage) {
    throw new JobRecoveryError(
      "NOTHING_TO_RETRY",
      "No recoverable stage found for this job."
    );
  }

  // Hard gate: never write after failed validation.
  if (
    (stage === "writer" || stage === "save") &&
    job.validation?.status === "FAILED"
  ) {
    throw new JobRecoveryError(
      "VALIDATION_BLOCKED",
      "Writer/Save cannot run after a failed validation."
    );
  }

  try {
    let updated: ImportJobRecord;

    switch (stage) {
      case "ocr": {
        const result = await runOcrForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "layout": {
        const result = await runLayoutForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "diagrams": {
        const result = await runDiagramsForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "structuring": {
        const result = await runStructuringForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "schema": {
        const result = await runSchemaBuildForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "validation": {
        const result = await runValidationForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "writer": {
        const result = await runWriterForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "review": {
        const result = await startReviewForJob(input.jobId);
        updated = result.job;
        break;
      }
      case "save": {
        const result = await runLocalSaveForJob(input.jobId);
        updated = result.job;
        break;
      }
    }

    return {
      job: updated,
      stageRetried: stage,
      message: `Retried stage "${stage}" successfully.`,
    };
  } catch (error) {
    await handleStageFailure({
      jobId: input.jobId,
      stage: stageLabelToPipelineStage(stage),
      reason: error instanceof Error ? error.message : "Retry failed.",
      error,
    });
    throw error;
  }
}
