/**
 * Safe CMS import-history deletion.
 * Deletes only job-scoped .cms artifacts + history records.
 * NEVER touches content/rgpv authoritative JSON.
 */

import fs from "fs/promises";
import path from "path";

import { getImportSessionStatus } from "./session-status";
import { getJob, listJobs } from "./import-queue";
import {
  getHistoryIndexPath,
  getHistoryRecordPath,
  readHistoryIndex,
  writeHistoryIndex,
} from "./history-storage";
import { PipelineStage } from "./pipeline-stage";
import { getCmsUploadsRoot, getJobDirectory } from "./temp-storage";
import { writeJsonAtomic } from "./json-writer";
import type { ImportJobRecord } from "./types";

/** Strict job id: job_ + 32 hex chars (UUID without dashes). */
export const CMS_JOB_ID_PATTERN = /^job_[a-f0-9]{32}$/i;

export class HistoryDeleteError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HistoryDeleteError";
    this.code = code;
  }
}

export interface HistoryDeleteResult {
  jobId: string;
  deleted: string[];
  preserved: string[];
  contentPreserved: boolean;
  wasSaved: boolean;
  message: string;
}

export function assertValidCmsJobId(jobId: string): string {
  const id = jobId.trim();
  if (!CMS_JOB_ID_PATTERN.test(id)) {
    throw new HistoryDeleteError(
      "JOB_ID_INVALID",
      "Invalid job id. Only CMS session identifiers are accepted."
    );
  }
  // Reject path separators / traversal even if regex somehow changes.
  if (
    id.includes("..") ||
    id.includes("/") ||
    id.includes("\\") ||
    id.includes("\0")
  ) {
    throw new HistoryDeleteError(
      "JOB_ID_INVALID",
      "Invalid job id path characters."
    );
  }
  return id;
}

function resolveSafeJobDir(jobId: string): string {
  const uploadsRoot = path.resolve(getCmsUploadsRoot());
  const jobDir = path.resolve(getJobDirectory(jobId));
  if (jobDir !== uploadsRoot && !jobDir.startsWith(uploadsRoot + path.sep)) {
    throw new HistoryDeleteError(
      "PATH_ESCAPE",
      "Resolved job directory escapes CMS uploads root."
    );
  }
  return jobDir;
}

async function removeJobFromQueueFile(jobId: string): Promise<boolean> {
  const queuePath = path.join(process.cwd(), ".cms", "queue", "queue.json");
  try {
    const raw = await fs.readFile(queuePath, "utf8");
    const entries = JSON.parse(raw) as Array<{ jobId: string; status: string }>;
    if (!Array.isArray(entries)) return false;
    const next = entries.filter((e) => e.jobId !== jobId);
    if (next.length === entries.length) return false;
    await writeJsonAtomic(queuePath, next);
    return true;
  } catch {
    return false;
  }
}

async function removeHistoryIndexEntry(jobId: string): Promise<boolean> {
  try {
    const index = await readHistoryIndex();
    const next = index.filter((id) => id !== jobId);
    if (next.length === index.length) return false;
    await writeHistoryIndex(next);
    return true;
  } catch {
    return false;
  }
}

async function rmTree(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

function isActivelyProcessing(job: ImportJobRecord): boolean {
  // Only block true in-flight pipeline work. Queued / Review Ready / Completed
  // / Failed / Cancelled may delete history (with UI confirmation).
  return getImportSessionStatus(job) === "Running";
}

/**
 * Deletes import session history + temporary artifacts for one job.
 * Authoritative content/rgpv JSON is never modified.
 */
export async function deleteImportHistory(
  rawJobId: string
): Promise<HistoryDeleteResult> {
  const jobId = assertValidCmsJobId(rawJobId);
  const job = await getJob(jobId);

  if (!job) {
    // Still allow cleaning orphan history / job folders if present.
    const historyPath = getHistoryRecordPath(jobId);
    const jobDir = resolveSafeJobDir(jobId);
    const deleted: string[] = [];
    try {
      await fs.access(historyPath);
      await fs.unlink(historyPath);
      deleted.push("history-record");
    } catch {
      /* absent */
    }
    await removeHistoryIndexEntry(jobId);
    await removeJobFromQueueFile(jobId);
    try {
      await fs.access(jobDir);
      await rmTree(jobDir);
      deleted.push("job-workspace");
    } catch {
      if (deleted.length === 0) {
        throw new HistoryDeleteError(
          "JOB_NOT_FOUND",
          `Import session not found: ${jobId}`
        );
      }
    }
    return {
      jobId,
      deleted,
      preserved: ["content/rgpv (untouched)"],
      contentPreserved: true,
      wasSaved: false,
      message: "Orphan CMS artifacts removed. Authoritative content untouched.",
    };
  }

  if (isActivelyProcessing(job)) {
    throw new HistoryDeleteError(
      "DELETE_BLOCKED_RUNNING",
      "Cannot delete a running import. Cancel it first, then delete history."
    );
  }

  const wasSaved =
    job.stage === PipelineStage.LOCAL_SAVED ||
    job.save?.status === "SUCCESS" ||
    job.status === "completed";

  const deleted: string[] = [];
  const preserved = ["content/rgpv (authoritative JSON never deleted)"];

  if (await removeJobFromQueueFile(jobId)) {
    deleted.push("queue-entry");
  }

  try {
    await fs.unlink(getHistoryRecordPath(jobId));
    deleted.push("history-record");
  } catch {
    /* optional */
  }
  if (await removeHistoryIndexEntry(jobId)) {
    deleted.push("history-index-entry");
  }

  const jobDir = resolveSafeJobDir(jobId);
  try {
    await fs.access(jobDir);
    await rmTree(jobDir);
    deleted.push(
      "job-workspace (OCR, evidence, checkpoints, diagnostics, originals)"
    );
  } catch {
    /* already gone */
  }

  // Explicitly assert we never resolve into content/
  const contentRoot = path.resolve(process.cwd(), "content");
  if (jobDir.startsWith(contentRoot + path.sep)) {
    throw new HistoryDeleteError(
      "PATH_ESCAPE",
      "Refusing to delete under content/."
    );
  }

  return {
    jobId,
    deleted,
    preserved,
    contentPreserved: true,
    wasSaved,
    message: wasSaved
      ? "Import history deleted. Saved content JSON remains untouched."
      : "Import history and temporary artifacts deleted.",
  };
}

/**
 * Bulk delete with per-job results. Continues on individual failures.
 */
export async function deleteImportHistoryBulk(jobIds: string[]): Promise<{
  results: HistoryDeleteResult[];
  errors: Array<{ jobId: string; code: string; message: string }>;
}> {
  const results: HistoryDeleteResult[] = [];
  const errors: Array<{ jobId: string; code: string; message: string }> = [];

  const unique = [...new Set(jobIds.map((id) => id.trim()).filter(Boolean))];
  for (const id of unique) {
    try {
      results.push(await deleteImportHistory(id));
    } catch (error) {
      if (error instanceof HistoryDeleteError) {
        errors.push({
          jobId: id,
          code: error.code,
          message: error.message,
        });
      } else {
        errors.push({
          jobId: id,
          code: "DELETE_FAILED",
          message: error instanceof Error ? error.message : "Delete failed.",
        });
      }
    }
  }

  return { results, errors };
}

/** Test helper: list current queue job ids (does not mutate content). */
export async function listQueueJobIds(): Promise<string[]> {
  const jobs = await listJobs();
  return jobs.map((j) => j.id);
}

export { getHistoryIndexPath };
