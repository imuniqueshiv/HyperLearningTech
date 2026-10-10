/**
 * Safe temporary artifact cleanup for CMS job workspaces.
 *
 * Never deletes:
 * - user-authoritative content/rgpv
 * - originals needed for review/recovery
 * - pending/production JSON, evidence, validation, review state
 *
 * After LOCAL_SAVED, may remove large intermediate rasters/temp page images
 * that are not required for audit of the saved import.
 */

import fs from "fs/promises";
import path from "path";

import { getJobDirectory } from "./temp-storage";
import { writeJsonAtomic } from "./json-writer";

/** Directories safe to purge after successful local save. */
const POST_SAVE_PURGE_DIRS = [
  "temp",
  "raster-cache",
  "page-rasters",
  "ocr-scratch",
];

/** File name patterns safe to remove after save (large intermediates). */
const POST_SAVE_PURGE_FILE_RE =
  /^(page-\d+\.(png|jpg|jpeg|webp)|raster-\d+\.(png|jpg|jpeg|webp)|ocr-temp-.*)$/i;

export interface ArtifactCleanupReport {
  jobId: string;
  cleanedAt: string;
  removedPaths: string[];
  skippedPaths: string[];
  bytesFreedEstimate: number;
  errors: string[];
}

/**
 * Remove disposable raster/temp artifacts after LOCAL_SAVED.
 * Keeps originals, JSON evidence, checkpoints, logs, diagrams staging.
 */
export async function cleanupPostSaveArtifacts(
  jobId: string
): Promise<ArtifactCleanupReport> {
  const jobDir = getJobDirectory(jobId);
  const report: ArtifactCleanupReport = {
    jobId,
    cleanedAt: new Date().toISOString(),
    removedPaths: [],
    skippedPaths: [],
    bytesFreedEstimate: 0,
    errors: [],
  };

  for (const rel of POST_SAVE_PURGE_DIRS) {
    const abs = path.join(jobDir, rel);
    try {
      const st = await fs.stat(abs);
      if (!st.isDirectory()) continue;
      const freed = await removeTree(abs);
      report.removedPaths.push(rel);
      report.bytesFreedEstimate += freed;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        continue;
      }
      report.errors.push(
        `${rel}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  try {
    const entries = await fs.readdir(jobDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!POST_SAVE_PURGE_FILE_RE.test(entry.name)) continue;
      const abs = path.join(jobDir, entry.name);
      try {
        const st = await fs.stat(abs);
        await fs.unlink(abs);
        report.removedPaths.push(entry.name);
        report.bytesFreedEstimate += st.size;
      } catch (error) {
        report.errors.push(
          `${entry.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch {
    // job dir listing failed — leave report as-is
  }

  try {
    await writeJsonAtomic(path.join(jobDir, "artifact-cleanup.json"), report);
  } catch {
    // non-fatal
  }

  return report;
}

async function removeTree(dir: string): Promise<number> {
  let bytes = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      bytes += await removeTree(abs);
      await fs.rmdir(abs).catch(() => undefined);
    } else {
      try {
        const st = await fs.stat(abs);
        bytes += st.size;
        await fs.unlink(abs);
      } catch {
        // skip
      }
    }
  }
  await fs.rmdir(dir).catch(() => undefined);
  return bytes;
}
