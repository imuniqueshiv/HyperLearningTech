/**
 * Runs independent per-job pipeline stages with concurrency limits.
 * Transitions are owned by the pipeline supervisor.
 */

import { handleStageFailure } from "./failure-handler";
import { recordJobHistory } from "./history-service";
import { getJob } from "./import-queue";
import { runWithConcurrency } from "./parallel-runner";
import { PipelineStage } from "./pipeline-stage";
import {
  superviseJobPipeline,
  type SupervisorMode,
} from "./pipeline-supervisor";
import { StageTimeoutError } from "./stage-runtime";

export type BatchPipelineMode = SupervisorMode;

/**
 * Executes pipeline stages for each job independently.
 * Never merges jobs. Stops a job's chain on first failure/timeout.
 *
 * When `resumable` is true, skips stages that already have summaries
 * so OCR/Gemini are never re-run after success.
 */
export async function runBatchPipeline(input: {
  jobIds: string[];
  maxConcurrency?: number;
  mode?: BatchPipelineMode;
  resumable?: boolean;
  autoReview?: boolean;
}): Promise<{
  succeeded: string[];
  failed: { jobId: string; error: string }[];
}> {
  const mode = input.mode ?? "through-writer";
  const resumable = input.resumable ?? false;
  const autoReview = input.autoReview ?? false;
  const succeeded: string[] = [];
  const failed: { jobId: string; error: string }[] = [];

  await runWithConcurrency(
    input.jobIds,
    async (jobId) => {
      try {
        await superviseJobPipeline({
          jobId,
          mode,
          resumable,
          autoReview,
        });
        succeeded.push(jobId);
        await recordJobHistory(jobId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Batch pipeline failed.";
        const job = await getJob(jobId);

        if (!(error instanceof StageTimeoutError)) {
          await handleStageFailure({
            jobId,
            stage: job?.stage ?? PipelineStage.FAILED,
            reason: message,
            error,
          });
        }

        failed.push({ jobId, error: message });
        try {
          await recordJobHistory(jobId);
        } catch {
          // ignore history errors
        }
      }
    },
    { maxConcurrency: input.maxConcurrency ?? 3 }
  );

  return { succeeded, failed };
}
