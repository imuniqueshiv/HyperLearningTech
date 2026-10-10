/**
 * Import-level diagnostics aggregated from stage checkpoints + job artifacts.
 * Concise observability for operators — not page-level log spam.
 */

import fs from "fs/promises";
import path from "path";

import { listCheckpoints, type StageCheckpoint } from "./stage-checkpoint";
import { getJobDirectory } from "./temp-storage";
import { writeJsonAtomic } from "./json-writer";
import { readJsonFile } from "./json-reader";
import { readJobMetadata } from "./job-manager";

export const CMS_IMPORT_DIAGNOSTICS_FILENAME = "import-diagnostics.json";

export interface ImportStageTiming {
  stageId: string;
  status: StageCheckpoint["status"];
  durationMs: number | null;
  error: string | null;
  recoveryHint: string | null;
}

export interface ImportDiagnostics {
  importId: string;
  startedAt: string | null;
  endedAt: string | null;
  totalDurationMs: number | null;
  inputType: string | null;
  pageCount: number | null;
  imageCount: number | null;
  ocrEngine: string | null;
  ocrDurationMs: number | null;
  rasterDurationMs: number | null;
  evidenceDurationMs: number | null;
  geminiDurationMs: number | null;
  validationDurationMs: number | null;
  saveDurationMs: number | null;
  finalState: string | null;
  warningCount: number;
  errorCount: number;
  stages: ImportStageTiming[];
  updatedAt: string;
}

function pickDuration(
  stages: ImportStageTiming[],
  predicates: RegExp[]
): number | null {
  let total = 0;
  let hit = false;
  for (const stage of stages) {
    if (
      predicates.some((re) => re.test(stage.stageId)) &&
      stage.durationMs != null
    ) {
      total += stage.durationMs;
      hit = true;
    }
  }
  return hit ? total : null;
}

/**
 * Build and persist import-diagnostics.json for a job.
 */
export async function writeImportDiagnostics(
  jobId: string,
  extras?: {
    warningCount?: number;
    errorCount?: number;
    pageCount?: number | null;
    finalState?: string | null;
  }
): Promise<ImportDiagnostics> {
  const metadata = await readJobMetadata(jobId);
  const checkpoints = await listCheckpoints(jobId);
  const stages: ImportStageTiming[] = checkpoints
    .map((c) => ({
      stageId: c.stageId,
      status: c.status,
      durationMs: c.durationMs,
      error: c.error,
      recoveryHint: c.recoveryHint,
    }))
    .sort((a, b) => a.stageId.localeCompare(b.stageId));

  const startedCandidates = checkpoints
    .map((c) => Date.parse(c.startedAt))
    .filter((n) => Number.isFinite(n));
  const endedCandidates = checkpoints
    .map((c) => (c.finishedAt ? Date.parse(c.finishedAt) : NaN))
    .filter((n) => Number.isFinite(n));

  const startedAt =
    startedCandidates.length > 0
      ? new Date(Math.min(...startedCandidates)).toISOString()
      : (metadata?.createdAt ?? null);
  const endedAt =
    endedCandidates.length > 0
      ? new Date(Math.max(...endedCandidates)).toISOString()
      : (metadata?.updatedAt ?? null);

  const totalDurationMs =
    startedAt && endedAt
      ? Math.max(0, Date.parse(endedAt) - Date.parse(startedAt))
      : null;

  const raw = await readJsonFile<{
    metadata?: { engine?: string; durationMs?: number; pageCount?: number };
    pages?: unknown[];
  }>(path.join(getJobDirectory(jobId), "raw-document.json"));

  const academic = await readJsonFile<{ durationMs?: number }>(
    path.join(getJobDirectory(jobId), "academic-document.json")
  );

  const diagnostics: ImportDiagnostics = {
    importId: jobId,
    startedAt,
    endedAt,
    totalDurationMs,
    inputType: metadata?.uploadMode ?? metadata?.mimeType ?? null,
    pageCount:
      extras?.pageCount ??
      metadata?.pageCount ??
      raw?.metadata?.pageCount ??
      raw?.pages?.length ??
      null,
    imageCount: metadata?.imageCount ?? metadata?.sourceFiles?.length ?? null,
    ocrEngine: raw?.metadata?.engine ?? "tesseract.js",
    ocrDurationMs:
      pickDuration(stages, [/^ocr$/i, /local.?ocr/i]) ??
      raw?.metadata?.durationMs ??
      null,
    rasterDurationMs: pickDuration(stages, [/raster/i]),
    evidenceDurationMs: pickDuration(stages, [/evidence/i]),
    geminiDurationMs:
      pickDuration(stages, [/structur/i, /gemini/i]) ??
      academic?.durationMs ??
      null,
    validationDurationMs: pickDuration(stages, [/validat/i]),
    saveDurationMs: pickDuration(stages, [/save/i, /writer/i, /diagram/i]),
    finalState:
      extras?.finalState ?? metadata?.stage ?? metadata?.status ?? null,
    warningCount: extras?.warningCount ?? 0,
    errorCount: extras?.errorCount ?? 0,
    stages,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonAtomic(
    path.join(getJobDirectory(jobId), CMS_IMPORT_DIAGNOSTICS_FILENAME),
    diagnostics
  );

  // Concise operator log — no page internals.
  const secs =
    diagnostics.totalDurationMs != null
      ? (diagnostics.totalDurationMs / 1000).toFixed(1)
      : "?";
  console.info(
    `INFO Import diagnostics duration=${secs}s pages=${diagnostics.pageCount ?? "?"} state=${diagnostics.finalState ?? "?"}`
  );

  return diagnostics;
}

export async function readImportDiagnostics(
  jobId: string
): Promise<ImportDiagnostics | null> {
  return readJsonFile<ImportDiagnostics>(
    path.join(getJobDirectory(jobId), CMS_IMPORT_DIAGNOSTICS_FILENAME)
  );
}

/**
 * Ensure diagnostics exist (best-effort; never throws to callers).
 */
export async function ensureImportDiagnostics(
  jobId: string,
  extras?: Parameters<typeof writeImportDiagnostics>[1]
): Promise<ImportDiagnostics | null> {
  try {
    return await writeImportDiagnostics(jobId, extras);
  } catch (error) {
    console.warn(
      `[CMS] Failed to write import diagnostics for ${jobId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Safe read without regenerating. */
export async function loadImportDiagnostics(
  jobId: string
): Promise<ImportDiagnostics | null> {
  try {
    return await readImportDiagnostics(jobId);
  } catch {
    return null;
  }
}

export async function diagnosticsFileExists(jobId: string): Promise<boolean> {
  try {
    await fs.access(
      path.join(getJobDirectory(jobId), CMS_IMPORT_DIAGNOSTICS_FILENAME)
    );
    return true;
  } catch {
    return false;
  }
}
