/**
 * Public rebuild API — regenerates Gemini → Schema → Validation → Writer
 * from existing OCR / layout / diagram artifacts.
 */

import {
  CMS_PROMPT_VERSION,
  CMS_REBUILD_REPORT_FILENAME,
  CMS_VALIDATION_VERSION,
} from "./constants";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import { canRebuildJob, RebuildManagerError } from "./rebuild-manager";
import { toRebuildRunSummary, writeRebuildReport } from "./rebuild-report";
import { runRebuildChain } from "./rebuild-runner";
import type {
  RebuildMode,
  RebuildReport,
  RebuildResult,
} from "./rebuild-types";
import { summarizeValidation } from "./rebuild-types";
import { readValidationReport } from "./validation-service";
import { recordJobHistory } from "./history-service";

export class RebuildProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RebuildProcessingError";
    this.code = code;
  }
}

export type { RebuildMode, RebuildResult, RebuildReport };

/**
 * Rebuilds selected post-OCR stages for one job.
 */
export async function runRebuildForJob(input: {
  jobId: string;
  mode?: RebuildMode;
}): Promise<RebuildResult> {
  const mode = input.mode ?? "full";
  const metadata = await readJobMetadata(input.jobId);
  if (!metadata) {
    throw new RebuildProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${input.jobId}`
    );
  }

  const pipeline = await readPipelineState(input.jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  if (currentStage === PipelineStage.REBUILDING) {
    throw new RebuildProcessingError(
      "REBUILD_IN_PROGRESS",
      "Rebuild is already in progress for this job."
    );
  }

  if (
    currentStage === PipelineStage.UPLOADED ||
    currentStage === PipelineStage.QUEUED ||
    currentStage === PipelineStage.OCR_PROCESSING ||
    currentStage === PipelineStage.OCR_COMPLETED ||
    currentStage === PipelineStage.LAYOUT_PROCESSING ||
    currentStage === PipelineStage.LAYOUT_COMPLETED ||
    currentStage === PipelineStage.DIAGRAM_EXTRACTION
  ) {
    throw new RebuildProcessingError(
      "NOT_READY",
      "Rebuild skips OCR/layout/diagrams — those stages must already be complete."
    );
  }

  if (
    currentStage !== PipelineStage.FAILED &&
    !canRebuildJob(currentStage) &&
    currentStage !== PipelineStage.DIAGRAMS_READY
  ) {
    throw new RebuildProcessingError(
      "NOT_READY",
      `Cannot rebuild from stage ${currentStage}.`
    );
  }

  const startedAt = new Date().toISOString();
  const oldValidation = summarizeValidation(
    await readValidationReport(input.jobId)
  );

  await updateJobStatus(input.jobId, "processing", {
    stage: PipelineStage.REBUILDING,
    error: null,
  });

  try {
    const chain = await runRebuildChain({
      jobId: input.jobId,
      mode,
    });

    const completedAt = new Date().toISOString();
    const newValidation = summarizeValidation(
      await readValidationReport(input.jobId)
    );

    const finalStage =
      mode === "structuring"
        ? PipelineStage.STRUCTURED
        : mode === "schema"
          ? PipelineStage.SCHEMA_READY
          : mode === "validation" || chain.validationBlockedWriter
            ? PipelineStage.VALIDATED
            : mode === "writer" || mode === "full"
              ? PipelineStage.REBUILT
              : PipelineStage.REBUILT;

    // After full/writer rebuild, land on REBUILT (Review Center accepts REBUILT).
    // If writer was skipped due to validation failure, stay VALIDATED.
    const landingStage = chain.validationBlockedWriter
      ? PipelineStage.VALIDATED
      : mode === "full" || mode === "writer"
        ? PipelineStage.REBUILT
        : finalStage;

    const report: RebuildReport = {
      jobId: input.jobId,
      mode,
      status: chain.validationBlockedWriter ? "FAILED" : "SUCCESS",
      startedAt,
      completedAt,
      durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(startedAt)),
      rebuiltStages: chain.rebuiltStages,
      skippedStages: chain.skippedStages,
      promptVersion: CMS_PROMPT_VERSION,
      validationVersion: CMS_VALIDATION_VERSION,
      oldValidation,
      newValidation,
      oldSchemaHash: chain.oldSchemaHash,
      newSchemaHash: chain.newSchemaHash,
      error: chain.validationBlockedWriter
        ? "Validation failed during rebuild; writer preview was not generated."
        : null,
    };

    await writeRebuildReport(report);
    const summary = toRebuildRunSummary(report);

    await updateJobStatus(
      input.jobId,
      chain.validationBlockedWriter ? "queued" : "queued",
      {
        stage: landingStage,
        error: report.error,
      }
    );

    const latestMetadata = await readJobMetadata(input.jobId);
    const latestPipeline = await readPipelineState(input.jobId);

    if (latestMetadata) {
      await updateJobMetadata({
        ...latestMetadata,
        stage: landingStage,
        status: "queued",
        updatedAt: completedAt,
        error: report.error,
      });
    }

    if (latestPipeline) {
      await updatePipelineState({
        ...latestPipeline,
        stage: landingStage,
        status: "queued",
        updatedAt: completedAt,
        error: report.error,
        rebuild: summary,
      });
    }

    const job = await getJob(input.jobId);
    if (!job) {
      throw new RebuildProcessingError(
        "JOB_HYDRATION_FAILED",
        "Rebuild finished but the job could not be reloaded."
      );
    }

    try {
      await recordJobHistory(input.jobId);
    } catch {
      // non-blocking
    }

    return {
      job: {
        ...job,
        stage: landingStage,
        rebuild: summary,
      },
      summary,
      report,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rebuild failed.";
    const code =
      error instanceof RebuildManagerError
        ? error.code
        : error instanceof RebuildProcessingError
          ? error.code
          : "REBUILD_FAILED";

    await updateJobStatus(input.jobId, "failed", {
      stage: PipelineStage.FAILED,
      error: message,
    });

    const completedAt = new Date().toISOString();
    const failedReport: RebuildReport = {
      jobId: input.jobId,
      mode,
      status: "FAILED",
      startedAt,
      completedAt,
      durationMs: Math.max(0, Date.parse(completedAt) - Date.parse(startedAt)),
      rebuiltStages: [],
      skippedStages: [],
      promptVersion: CMS_PROMPT_VERSION,
      validationVersion: CMS_VALIDATION_VERSION,
      oldValidation,
      newValidation: null,
      oldSchemaHash: null,
      newSchemaHash: null,
      error: message,
    };

    try {
      await writeRebuildReport(failedReport);
    } catch {
      // ignore
    }

    throw new RebuildProcessingError(code, message);
  }
}

/**
 * Rebuilds many jobs independently (never merges).
 */
export async function runRebuildForJobs(input: {
  jobIds: string[];
  mode?: RebuildMode;
}): Promise<{
  succeeded: string[];
  failed: { jobId: string; error: string }[];
}> {
  const succeeded: string[] = [];
  const failed: { jobId: string; error: string }[] = [];

  for (const jobId of input.jobIds) {
    try {
      await runRebuildForJob({ jobId, mode: input.mode ?? "full" });
      succeeded.push(jobId);
    } catch (error) {
      failed.push({
        jobId,
        error: error instanceof Error ? error.message : "Rebuild failed.",
      });
    }
  }

  return { succeeded, failed };
}

export { readRebuildReport } from "./rebuild-report";
export { canRebuildJob } from "./rebuild-manager";
export { CMS_REBUILD_REPORT_FILENAME };
