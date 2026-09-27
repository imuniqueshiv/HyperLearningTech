/**
 * Bulk upload: N independent jobs from N files.
 */

import { createBatchRecord } from "./bulk-job-manager";
import { runBatchPipeline, type BatchPipelineMode } from "./batch-service";
import type { BulkUploadResult } from "./history-types";
import { recordJobHistory } from "./history-service";
import { processUpload } from "./upload-service";
import type { ImportJobRecord, JobType } from "./types";

export class BulkUploadError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BulkUploadError";
    this.code = code;
  }
}

export interface BulkUploadInput {
  files: File[];
  /** Per-file job type, or a single type applied to all. */
  type: JobType | JobType[];
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
  maxConcurrency?: number;
  /** When true, run pipeline stages after enqueue (independent per job). */
  autoPipeline?: boolean;
  pipelineMode?: BatchPipelineMode;
}

/**
 * Creates one import job per file. Never merges jobs.
 */
export async function processBulkUpload(
  input: BulkUploadInput
): Promise<
  BulkUploadResult & { pipeline?: Awaited<ReturnType<typeof runBatchPipeline>> }
> {
  if (!input.files.length) {
    throw new BulkUploadError(
      "FILES_REQUIRED",
      "At least one file is required."
    );
  }

  const jobs: ImportJobRecord[] = [];
  const failed: { filename: string; error: string }[] = [];

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];
    const type = Array.isArray(input.type)
      ? (input.type[index] ?? input.type[0] ?? "bulk")
      : input.type;

    try {
      const job = await processUpload({
        file,
        type,
        branch: input.branch,
        semester: input.semester,
        subjectCode: input.subjectCode,
      });
      jobs.push(job);
      await recordJobHistory(job.id);
    } catch (error) {
      failed.push({
        filename: file.name,
        error: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  const batch = await createBatchRecord({
    jobIds: jobs.map((job) => job.id),
    maxConcurrency: input.maxConcurrency ?? 3,
    autoPipeline: Boolean(input.autoPipeline),
  });

  let pipeline: Awaited<ReturnType<typeof runBatchPipeline>> | undefined;

  if (input.autoPipeline && jobs.length > 0) {
    pipeline = await runBatchPipeline({
      jobIds: jobs.map((job) => job.id),
      maxConcurrency: input.maxConcurrency ?? 3,
      mode: input.pipelineMode ?? "through-writer",
    });
  }

  return {
    batchId: batch.batchId,
    jobs,
    created: jobs.length,
    failed,
    pipeline,
  };
}
