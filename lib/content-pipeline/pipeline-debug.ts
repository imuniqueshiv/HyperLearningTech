/**
 * Debug snapshot for Import Session pipeline observability.
 */

import fs from "fs/promises";
import path from "path";

import { getJob } from "./import-queue";
import { readPipelineState } from "./job-manager";
import { inferResumeStage, STAGE_SEQUENCE } from "./pipeline-supervisor";
import { listCheckpoints, readCheckpoint } from "./stage-checkpoint";
import { STAGE_TIMEOUT_MS } from "./stage-runtime";
import { getJobDirectory } from "./temp-storage";

export interface PipelineDebugSnapshot {
  jobId: string;
  currentStage: string | null;
  status: string | null;
  error: string | null;
  started: string | null;
  elapsedMs: number | null;
  heartbeatAt: string | null;
  pendingOperation: string | null;
  lastLog: string | null;
  artifacts: Record<string, boolean>;
  resumePoint: string | null;
  timeoutMs: number | null;
  timeoutRemainingMs: number | null;
  extractedMetadata: unknown;
  checkpoints: Awaited<ReturnType<typeof listCheckpoints>>;
  summaries: {
    ocr: boolean;
    layout: boolean;
    diagrams: boolean;
    structuring: boolean;
    schema: boolean;
    validation: boolean;
    writing: boolean;
  };
}

async function readLogTail(
  jobId: string,
  stageNames: string[]
): Promise<string | null> {
  const logsDir = path.join(getJobDirectory(jobId), "logs");
  for (const name of stageNames) {
    try {
      const raw = await fs.readFile(path.join(logsDir, `${name}.log`), "utf8");
      const trimmed = raw.trim();
      if (trimmed) return trimmed.slice(-1200);
    } catch {
      // try next
    }
  }
  return null;
}

async function artifactExists(
  jobId: string,
  relative: string
): Promise<boolean> {
  try {
    await fs.access(path.join(getJobDirectory(jobId), relative));
    return true;
  } catch {
    return false;
  }
}

export async function getPipelineDebugSnapshot(
  jobId: string
): Promise<PipelineDebugSnapshot | null> {
  const job = await getJob(jobId);
  const pipeline = await readPipelineState(jobId);
  if (!job && !pipeline) return null;

  const resumePoint = inferResumeStage(job);
  const runningCheckpoint =
    resumePoint != null ? await readCheckpoint(jobId, resumePoint) : null;
  const active =
    runningCheckpoint?.status === "RUNNING" ? runningCheckpoint : null;

  const startedAt = active?.startedAt ?? null;
  const startedMs = startedAt ? Date.parse(startedAt) : NaN;
  const now = Date.now();
  const elapsedMs = Number.isFinite(startedMs)
    ? Math.max(0, now - startedMs)
    : null;
  const timeoutMs =
    active?.timeoutMs ?? (resumePoint ? STAGE_TIMEOUT_MS[resumePoint] : null);
  const timeoutRemainingMs =
    timeoutMs != null && elapsedMs != null
      ? Math.max(0, timeoutMs - elapsedMs)
      : null;

  const lastLog = await readLogTail(jobId, [
    "resume",
    "reconstruction",
    "structuring",
    "writer",
    "validation",
    "schema",
    "layout",
    "ocr",
    "diagrams",
  ]);

  return {
    jobId,
    currentStage: pipeline?.stage ?? job?.stage ?? null,
    status: pipeline?.status ?? job?.status ?? null,
    error: pipeline?.error ?? job?.error ?? null,
    started: startedAt,
    elapsedMs,
    heartbeatAt: active?.heartbeatAt ?? null,
    pendingOperation: active ? `stage:${active.stageId}` : null,
    lastLog,
    artifacts: {
      "raw-document.json": await artifactExists(jobId, "raw-document.json"),
      "structured-document.json": await artifactExists(
        jobId,
        "structured-document.json"
      ),
      "academic-document.json": await artifactExists(
        jobId,
        "academic-document.json"
      ),
      "production-pyqs.json": await artifactExists(
        jobId,
        "production-pyqs.json"
      ),
      "validation-report.json": await artifactExists(
        jobId,
        "validation-report.json"
      ),
      "write-report.json": await artifactExists(jobId, "write-report.json"),
      "pipeline.json": await artifactExists(jobId, "pipeline.json"),
    },
    resumePoint,
    timeoutMs,
    timeoutRemainingMs,
    extractedMetadata: job?.extractedMetadata ?? null,
    checkpoints: await listCheckpoints(jobId),
    summaries: {
      ocr: Boolean(job?.ocr ?? pipeline?.ocr),
      layout: Boolean(job?.layout ?? pipeline?.layout),
      diagrams: Boolean(job?.diagrams ?? pipeline?.diagrams),
      structuring: Boolean(job?.structuring ?? pipeline?.structuring),
      schema: Boolean(job?.schema ?? pipeline?.schema),
      validation: Boolean(job?.validation ?? pipeline?.validation),
      writing: Boolean(job?.writing ?? pipeline?.writing),
    },
  };
}

export { STAGE_SEQUENCE };
