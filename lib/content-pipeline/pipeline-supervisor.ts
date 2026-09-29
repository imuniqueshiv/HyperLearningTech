/**
 * Pipeline supervisor — owns stage transitions, timeouts, resume, logging.
 * Individual stage services never launch the next stage.
 */

import { handleStageFailure } from "./failure-handler";
import { getJob, updateJobStatus } from "./import-queue";
import { runLayoutForJob } from "./layout-service";
import { runOcrForJob } from "./ocr-service";
import { PipelineStage } from "./pipeline-stage";
import { startReviewForJob } from "./review-service";
import { runSchemaBuildForJob } from "./schema-builder-service";
import {
  beginCheckpoint,
  finishCheckpoint,
  heartbeatCheckpoint,
} from "./stage-checkpoint";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import {
  STAGE_TIMEOUT_MS,
  StageTimeoutError,
  SupervisedStageId,
  timedAwait,
  withStageTimeout,
} from "./stage-runtime";
import { runStructuringForJob } from "./structuring-service";
import type { ImportJobRecord } from "./types";
import { runValidationForJob } from "./validation-service";
import { runWriterForJob } from "./writer-service";
import { runDiagramsForJob } from "./diagram-service";

export type SupervisorMode =
  | "ocr"
  | "through-layout"
  | "through-diagrams"
  | "through-structuring"
  | "through-schema"
  | "through-validation"
  | "through-writer";

const STAGE_SEQUENCE: SupervisedStageId[] = [
  "ocr",
  "layout",
  "reconstruction",
  "structuring",
  "schema",
  "validation",
  "writer",
];

function modeLimit(mode: SupervisorMode): SupervisedStageId {
  switch (mode) {
    case "ocr":
      return "ocr";
    case "through-layout":
      return "layout";
    case "through-diagrams":
      return "reconstruction";
    case "through-structuring":
      return "structuring";
    case "through-schema":
      return "schema";
    case "through-validation":
      return "validation";
    case "through-writer":
      return "writer";
  }
}

function hasCompleted(
  job: ImportJobRecord | null,
  field: keyof Pick<
    ImportJobRecord,
    | "ocr"
    | "layout"
    | "diagrams"
    | "structuring"
    | "schema"
    | "validation"
    | "writing"
  >
): boolean {
  return Boolean(job?.[field]);
}

function isStageComplete(
  job: ImportJobRecord | null,
  stageId: SupervisedStageId
): boolean {
  if (!job) return false;
  switch (stageId) {
    case "ocr":
      return hasCompleted(job, "ocr");
    case "layout":
      return hasCompleted(job, "layout");
    case "reconstruction":
      return hasCompleted(job, "diagrams");
    case "structuring":
      return hasCompleted(job, "structuring");
    case "schema":
      return hasCompleted(job, "schema");
    case "validation":
      return (
        hasCompleted(job, "validation") && job.validation?.status === "PASS"
      );
    case "writer":
      return hasCompleted(job, "writing");
    case "review":
      return Boolean(job.review);
  }
}

async function runStageRunner(
  jobId: string,
  stageId: SupervisedStageId
): Promise<void> {
  switch (stageId) {
    case "ocr":
      await runOcrForJob(jobId);
      return;
    case "layout":
      await runLayoutForJob(jobId);
      return;
    case "reconstruction":
      await runDiagramsForJob(jobId);
      return;
    case "structuring":
      await runStructuringForJob(jobId);
      return;
    case "schema":
      await runSchemaBuildForJob(jobId);
      return;
    case "validation":
      await runValidationForJob(jobId);
      return;
    case "writer":
      await runWriterForJob(jobId);
      return;
    case "review":
      await startReviewForJob(jobId);
      return;
  }
}

async function markJobTimeout(input: {
  jobId: string;
  stageId: string;
  timeoutMs: number;
}): Promise<void> {
  const message = `Stage "${input.stageId}" timed out after ${input.timeoutMs}ms.`;
  await updateJobStatus(input.jobId, "failed", {
    stage: PipelineStage.TIMEOUT,
    error: message,
  });
  await handleStageFailure({
    jobId: input.jobId,
    stage: PipelineStage.TIMEOUT,
    reason: message,
  });
}

/**
 * Runs supervised stages for one job. Resume skips completed summaries.
 */
export async function superviseJobPipeline(input: {
  jobId: string;
  mode?: SupervisorMode;
  resumable?: boolean;
  autoReview?: boolean;
}): Promise<void> {
  const mode = input.mode ?? "through-writer";
  const resumable = input.resumable ?? true;
  const autoReview = input.autoReview ?? false;
  const limit = modeLimit(mode);
  const limitIdx = STAGE_SEQUENCE.indexOf(limit);

  const resumeStartedAt = resumable
    ? await logStageStart({
        jobId: input.jobId,
        stage: "resume",
        details: { mode, resumable },
      })
    : null;

  try {
    for (let i = 0; i <= limitIdx; i += 1) {
      const stageId = STAGE_SEQUENCE[i];
      let job = await getJob(input.jobId);

      if (resumable && isStageComplete(job, stageId)) {
        console.log("[Supervisor] SKIP completed stage", {
          jobId: input.jobId,
          stageId,
        });
        continue;
      }

      const timeoutMs = STAGE_TIMEOUT_MS[stageId];
      console.log("[Supervisor] BEGIN", {
        jobId: input.jobId,
        stageId,
        timeoutMs,
      });

      await beginCheckpoint({
        jobId: input.jobId,
        stageId,
        timeoutMs,
      });

      const heartbeat = setInterval(() => {
        void heartbeatCheckpoint(input.jobId, stageId);
      }, 5_000);

      try {
        await withStageTimeout({
          stageId,
          timeoutMs,
          jobId: input.jobId,
          run: async () => {
            await timedAwait(
              `supervisor.${stageId}`,
              runStageRunner(input.jobId, stageId),
              { jobId: input.jobId }
            );
          },
        });

        await finishCheckpoint({
          jobId: input.jobId,
          stageId,
          status: "SUCCESS",
        });
        console.log("[Supervisor] SUCCESS", {
          jobId: input.jobId,
          stageId,
        });

        if (stageId === "validation") {
          job = await getJob(input.jobId);
          if (job?.validation?.status === "FAILED") {
            const reason = job.error ?? "Validation failed. Writer skipped.";
            await updateJobStatus(input.jobId, "failed", {
              stage: PipelineStage.FAILED,
              error: reason,
            });
            await handleStageFailure({
              jobId: input.jobId,
              stage: PipelineStage.FAILED,
              reason,
            });
            throw new Error("Validation failed — writer not executed.");
          }
        }
      } catch (error) {
        clearInterval(heartbeat);
        if (error instanceof StageTimeoutError) {
          console.log("[Supervisor] TIMEOUT", {
            jobId: input.jobId,
            stageId,
            timeoutMs,
          });
          await finishCheckpoint({
            jobId: input.jobId,
            stageId,
            status: "TIMEOUT",
            error: error.message,
          });
          await markJobTimeout({
            jobId: input.jobId,
            stageId,
            timeoutMs,
          });
          throw error;
        }

        console.log("[Supervisor] FAILED", {
          jobId: input.jobId,
          stageId,
          error: error instanceof Error ? error.message : String(error),
        });
        await finishCheckpoint({
          jobId: input.jobId,
          stageId,
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        clearInterval(heartbeat);
      }
    }

    if (autoReview && mode === "through-writer") {
      try {
        await timedAwait("supervisor.review", startReviewForJob(input.jobId), {
          jobId: input.jobId,
        });
      } catch (error) {
        console.error(
          "[Supervisor] Auto-review failed (non-fatal):",
          error instanceof Error ? error.message : error
        );
      }
    }

    if (resumeStartedAt) {
      await logStageSuccess({
        jobId: input.jobId,
        stage: "resume",
        startedAt: resumeStartedAt,
        details: { outcome: "succeeded" },
      });
    }
  } catch (error) {
    if (resumeStartedAt) {
      try {
        await logStageFailure({
          jobId: input.jobId,
          stage: "resume",
          startedAt: resumeStartedAt,
          error,
        });
      } catch {
        // ignore log errors
      }
    }
    throw error;
  }
}

/**
 * Infers the next incomplete supervised stage for debug/resume UIs.
 */
export function inferResumeStage(
  job: ImportJobRecord | null
): SupervisedStageId | null {
  if (!job) return null;
  for (const stageId of STAGE_SEQUENCE) {
    if (!isStageComplete(job, stageId)) return stageId;
  }
  return null;
}

export { STAGE_SEQUENCE };
