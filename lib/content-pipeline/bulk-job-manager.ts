/**
 * Batch metadata for bulk uploads.
 */

import path from "path";

import type { BatchStatus } from "./history-types";
import { getJob } from "./import-queue";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";
import { progressPercentForStage } from "./progress";
import { generateJobId } from "./job-id";

const BATCH_DIR = path.join(process.cwd(), ".cms", "batches");

export interface BatchRecord {
  batchId: string;
  createdAt: string;
  maxConcurrency: number;
  jobIds: string[];
  autoPipeline: boolean;
}

export function getBatchPath(batchId: string): string {
  return path.join(BATCH_DIR, `${batchId}.json`);
}

export async function createBatchRecord(input: {
  jobIds: string[];
  maxConcurrency: number;
  autoPipeline: boolean;
}): Promise<BatchRecord> {
  const batchId = `batch_${generateJobId()}`;
  const record: BatchRecord = {
    batchId,
    createdAt: new Date().toISOString(),
    maxConcurrency: input.maxConcurrency,
    jobIds: input.jobIds,
    autoPipeline: input.autoPipeline,
  };

  await writeJsonAtomic(getBatchPath(batchId), record);
  return record;
}

export async function readBatchRecord(
  batchId: string
): Promise<BatchRecord | null> {
  return readJsonFile<BatchRecord>(getBatchPath(batchId));
}

export async function getBatchStatus(
  batchId: string
): Promise<BatchStatus | null> {
  const record = await readBatchRecord(batchId);
  if (!record) {
    return null;
  }

  const items = [];
  let running = 0;
  let queued = 0;
  let completed = 0;
  let failed = 0;
  let cancelled = 0;

  for (const jobId of record.jobIds) {
    const job = await getJob(jobId);
    if (!job) {
      continue;
    }

    if (job.status === "processing") running += 1;
    else if (job.status === "queued" || job.status === "awaiting_review")
      queued += 1;
    else if (job.status === "completed" || job.status === "approved")
      completed += 1;
    else if (job.status === "failed" || job.status === "rejected") failed += 1;
    else if (job.status === "cancelled") cancelled += 1;

    items.push({
      jobId: job.id,
      filename: job.originalFilename,
      status: job.status,
      stage: job.stage,
      progressPercent: progressPercentForStage(job.stage),
      error: job.error,
    });
  }

  return {
    batchId: record.batchId,
    createdAt: record.createdAt,
    maxConcurrency: record.maxConcurrency,
    jobIds: record.jobIds,
    running,
    queued,
    completed,
    failed,
    cancelled,
    items,
  };
}
