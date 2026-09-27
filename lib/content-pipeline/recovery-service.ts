/**
 * Recovery orchestration: retry failed stage or rollback local save.
 */

import { recordJobHistory } from "./history-service";
import type { RecoveryActionResult } from "./history-types";
import {
  inferRetryStage,
  retryFailedStage,
  type RecoverableStage,
  JobRecoveryError,
} from "./job-recovery";
import { getJob } from "./import-queue";
import { rollbackLocalSave, RollbackProcessingError } from "./rollback-service";

export class RecoveryProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RecoveryProcessingError";
    this.code = code;
  }
}

export async function runRecoveryAction(input: {
  jobId: string;
  action: "retry" | "rollback";
  stage?: RecoverableStage | null;
}): Promise<RecoveryActionResult> {
  const job = await getJob(input.jobId);
  if (!job) {
    throw new RecoveryProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${input.jobId}`
    );
  }

  try {
    if (input.action === "rollback") {
      const result = await rollbackLocalSave(input.jobId);
      await recordJobHistory(input.jobId);
      return {
        jobId: input.jobId,
        action: "rollback",
        stageRetried: null,
        restoredFiles: result.restoredFiles,
        success: true,
        message: result.message,
      };
    }

    const retry = await retryFailedStage({
      jobId: input.jobId,
      stage: input.stage ?? inferRetryStage(job),
    });
    await recordJobHistory(input.jobId);

    return {
      jobId: input.jobId,
      action: "retry",
      stageRetried: retry.stageRetried,
      restoredFiles: [],
      success: true,
      message: retry.message,
    };
  } catch (error) {
    if (
      error instanceof JobRecoveryError ||
      error instanceof RollbackProcessingError
    ) {
      throw new RecoveryProcessingError(error.code, error.message);
    }
    throw new RecoveryProcessingError(
      "RECOVERY_FAILED",
      error instanceof Error ? error.message : "Recovery failed."
    );
  }
}

export { inferRetryStage, type RecoverableStage };
