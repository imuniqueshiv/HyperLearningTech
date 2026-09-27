/**
 * Stage failure recording for recovery.
 */

import { recordJobHistory } from "./history-service";
import type { StageFailureRecord, StageOutcome } from "./history-types";
import type { PipelineStage } from "./pipeline-stage";
import { writeJsonAtomic } from "./json-writer";
import { readJsonFile } from "./json-reader";
import { getJobDirectory } from "./temp-storage";
import path from "path";

const FAILURE_FILENAME = "failure-log.json";

export interface FailureLog {
  jobId: string;
  failures: StageFailureRecord[];
  updatedAt: string;
}

export function createStageFailure(input: {
  stage: PipelineStage | string;
  reason: string;
  error?: unknown;
  outcome?: StageOutcome;
}): StageFailureRecord {
  const err = input.error;
  const stack =
    err instanceof Error && err.stack
      ? err.stack
      : err instanceof Error
        ? err.message
        : null;

  return {
    stage: input.stage,
    reason: input.reason,
    stack,
    timestamp: new Date().toISOString(),
    outcome: input.outcome ?? "Failure",
  };
}

export async function appendStageFailure(
  jobId: string,
  failure: StageFailureRecord
): Promise<FailureLog> {
  const logPath = path.join(getJobDirectory(jobId), FAILURE_FILENAME);
  const existing = (await readJsonFile<FailureLog>(logPath)) ?? {
    jobId,
    failures: [],
    updatedAt: new Date().toISOString(),
  };

  const next: FailureLog = {
    jobId,
    failures: [...existing.failures, failure],
    updatedAt: new Date().toISOString(),
  };

  await writeJsonAtomic(logPath, next);
  await recordJobHistory(jobId, failure);
  return next;
}

export async function readFailureLog(
  jobId: string
): Promise<FailureLog | null> {
  return readJsonFile<FailureLog>(
    path.join(getJobDirectory(jobId), FAILURE_FILENAME)
  );
}

/**
 * Marks a pipeline hard-stop: record failure and refresh history.
 * Callers still set stage FAILED via their own catch blocks.
 */
export async function handleStageFailure(input: {
  jobId: string;
  stage: PipelineStage | string;
  reason: string;
  error?: unknown;
  outcome?: StageOutcome;
}): Promise<StageFailureRecord> {
  const failure = createStageFailure(input);
  await appendStageFailure(input.jobId, failure);
  return failure;
}
