/**
 * Per-stage checkpoints under `.cms/uploads/<jobId>/checkpoints/`.
 */

import fs from "fs/promises";
import path from "path";

import { getJobDirectory } from "./temp-storage";

export type CheckpointStatus =
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT"
  | "RESUMED";

export interface StageCheckpoint {
  jobId: string;
  stageId: string;
  status: CheckpointStatus;
  startedAt: string;
  finishedAt: string | null;
  heartbeatAt: string | null;
  durationMs: number | null;
  error: string | null;
  recoveryHint: string | null;
  artifacts: string[];
  timeoutMs: number | null;
}

function checkpointsDir(jobId: string): string {
  return path.join(getJobDirectory(jobId), "checkpoints");
}

export function getCheckpointPath(jobId: string, stageId: string): string {
  return path.join(checkpointsDir(jobId), `${stageId}.json`);
}

export async function writeCheckpoint(
  checkpoint: StageCheckpoint
): Promise<void> {
  const dir = checkpointsDir(checkpoint.jobId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    getCheckpointPath(checkpoint.jobId, checkpoint.stageId),
    JSON.stringify(checkpoint, null, 2) + "\n",
    "utf8"
  );
}

export async function readCheckpoint(
  jobId: string,
  stageId: string
): Promise<StageCheckpoint | null> {
  try {
    const raw = await fs.readFile(getCheckpointPath(jobId, stageId), "utf8");
    return JSON.parse(raw) as StageCheckpoint;
  } catch {
    return null;
  }
}

export async function listCheckpoints(
  jobId: string
): Promise<StageCheckpoint[]> {
  try {
    const dir = checkpointsDir(jobId);
    const names = await fs.readdir(dir);
    const checkpoints: StageCheckpoint[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(dir, name), "utf8");
        checkpoints.push(JSON.parse(raw) as StageCheckpoint);
      } catch {
        // skip corrupt
      }
    }
    return checkpoints;
  } catch {
    return [];
  }
}

export async function beginCheckpoint(input: {
  jobId: string;
  stageId: string;
  timeoutMs: number;
  artifacts?: string[];
}): Promise<StageCheckpoint> {
  const startedAt = new Date().toISOString();
  const checkpoint: StageCheckpoint = {
    jobId: input.jobId,
    stageId: input.stageId,
    status: "RUNNING",
    startedAt,
    finishedAt: null,
    heartbeatAt: startedAt,
    durationMs: null,
    error: null,
    recoveryHint: null,
    artifacts: input.artifacts ?? [],
    timeoutMs: input.timeoutMs,
  };
  await writeCheckpoint(checkpoint);
  return checkpoint;
}

export async function heartbeatCheckpoint(
  jobId: string,
  stageId: string
): Promise<void> {
  const existing = await readCheckpoint(jobId, stageId);
  if (!existing || existing.status !== "RUNNING") return;
  await writeCheckpoint({
    ...existing,
    heartbeatAt: new Date().toISOString(),
  });
}

export async function finishCheckpoint(input: {
  jobId: string;
  stageId: string;
  status: Exclude<CheckpointStatus, "RUNNING">;
  error?: string | null;
  recoveryHint?: string | null;
  artifacts?: string[];
}): Promise<StageCheckpoint | null> {
  const existing = await readCheckpoint(input.jobId, input.stageId);
  if (!existing) return null;
  const finishedAt = new Date().toISOString();
  const started = Date.parse(existing.startedAt);
  const checkpoint: StageCheckpoint = {
    ...existing,
    status: input.status,
    finishedAt,
    heartbeatAt: finishedAt,
    durationMs: Number.isFinite(started)
      ? Math.max(0, Date.parse(finishedAt) - started)
      : null,
    error: input.error ?? null,
    recoveryHint:
      input.recoveryHint ??
      (input.status === "TIMEOUT" || input.status === "FAILED"
        ? `Resume from stage "${input.stageId}". Do not rerun earlier successful stages.`
        : null),
    artifacts: input.artifacts ?? existing.artifacts,
  };
  await writeCheckpoint(checkpoint);
  return checkpoint;
}
