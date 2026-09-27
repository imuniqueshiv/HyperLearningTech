/**
 * Per-stage pipeline diagnostics under `.cms/uploads/<jobId>/logs/`.
 */

import fs from "fs/promises";
import path from "path";

import { getJobDirectory } from "./temp-storage";

export type StageLogName =
  | "ocr"
  | "layout"
  | "diagrams"
  | "reconstruction"
  | "structuring"
  | "schema"
  | "validation"
  | "writer"
  | "merge"
  | "resume";

export interface StageLogEntry {
  stage: string;
  jobId: string;
  startedAt: string;
  endedAt: string | null;
  success: boolean | null;
  errorMessage: string | null;
  stack: string | null;
  details?: Record<string, unknown>;
}

function getLogsDir(jobId: string): string {
  return path.join(getJobDirectory(jobId), "logs");
}

function getLogPath(jobId: string, stage: StageLogName): string {
  return path.join(getLogsDir(jobId), `${stage}.log`);
}

async function appendLogLine(jobId: string, stage: StageLogName, line: string) {
  const dir = getLogsDir(jobId);
  await fs.mkdir(dir, { recursive: true });
  await fs.appendFile(getLogPath(jobId, stage), line + "\n", "utf8");
}

function formatBlock(entry: StageLogEntry): string {
  const started = entry.startedAt ? Date.parse(entry.startedAt) : NaN;
  const ended = entry.endedAt ? Date.parse(entry.endedAt) : NaN;
  const durationMs =
    Number.isFinite(started) && Number.isFinite(ended)
      ? Math.max(0, ended - started)
      : null;

  const lines = [
    "========",
    `Stage: ${entry.stage}`,
    `Job ID: ${entry.jobId}`,
    `Start: ${entry.startedAt}`,
    `End: ${entry.endedAt ?? "—"}`,
    `DurationMs: ${durationMs ?? "—"}`,
    `Result: ${
      entry.success === null ? "STARTED" : entry.success ? "SUCCESS" : "FAILURE"
    }`,
    `Error: ${entry.errorMessage ?? "—"}`,
    `Stack: ${entry.stack ?? "—"}`,
    `RecoveryHint: ${
      entry.success === false
        ? `Resume from stage "${entry.stage}" only. Do not rerun earlier successful stages.`
        : "—"
    }`,
  ];

  if (entry.details && Object.keys(entry.details).length > 0) {
    lines.push(`Details: ${JSON.stringify(entry.details, null, 2)}`);
  }

  lines.push("========");
  return lines.join("\n");
}

export async function logStageStart(input: {
  jobId: string;
  stage: StageLogName;
  details?: Record<string, unknown>;
}): Promise<string> {
  const startedAt = new Date().toISOString();
  await appendLogLine(
    input.jobId,
    input.stage,
    formatBlock({
      stage: input.stage,
      jobId: input.jobId,
      startedAt,
      endedAt: null,
      success: null,
      errorMessage: null,
      stack: null,
      details: input.details,
    })
  );
  return startedAt;
}

export async function logStageSuccess(input: {
  jobId: string;
  stage: StageLogName;
  startedAt: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const endedAt = new Date().toISOString();
  await appendLogLine(
    input.jobId,
    input.stage,
    formatBlock({
      stage: input.stage,
      jobId: input.jobId,
      startedAt: input.startedAt,
      endedAt,
      success: true,
      errorMessage: null,
      stack: null,
      details: input.details,
    })
  );
}

export async function logStageFailure(input: {
  jobId: string;
  stage: StageLogName;
  startedAt: string;
  error: unknown;
  details?: Record<string, unknown>;
}): Promise<void> {
  const endedAt = new Date().toISOString();
  const errorMessage =
    input.error instanceof Error ? input.error.message : String(input.error);
  const stack =
    input.error instanceof Error && input.error.stack
      ? input.error.stack
      : null;

  await appendLogLine(
    input.jobId,
    input.stage,
    formatBlock({
      stage: input.stage,
      jobId: input.jobId,
      startedAt: input.startedAt,
      endedAt,
      success: false,
      errorMessage,
      stack,
      details: input.details,
    })
  );
}

/**
 * Runs a stage body with start/success/failure logging.
 */
export async function withStageLog<T>(input: {
  jobId: string;
  stage: StageLogName;
  details?: Record<string, unknown>;
  run: () => Promise<T>;
}): Promise<T> {
  const startedAt = await logStageStart({
    jobId: input.jobId,
    stage: input.stage,
    details: input.details,
  });

  try {
    const result = await input.run();
    await logStageSuccess({
      jobId: input.jobId,
      stage: input.stage,
      startedAt,
    });
    return result;
  } catch (error) {
    await logStageFailure({
      jobId: input.jobId,
      stage: input.stage,
      startedAt,
      error,
    });
    throw error;
  }
}
