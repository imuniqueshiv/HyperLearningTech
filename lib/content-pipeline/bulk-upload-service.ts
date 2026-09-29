/**
 * Bulk upload: N independent Import Sessions from N files.
 * Same security boundary as single upload (limits, checksum, durable schedule).
 * Never runs the pipeline inline inside the HTTP request.
 */

import { createBatchRecord } from "./bulk-job-manager";
import type { BulkUploadResult } from "./history-types";
import { recordJobHistory } from "./history-service";
import {
  IMPORT_LIMIT_MESSAGES,
  MAX_IMPORT_IMAGES,
  MAX_PAPERS_PER_IMPORT,
  parseImportUploadMode,
} from "./import-limits";
import { processImportSession } from "./import-session-service";
import { scheduleImportPipeline } from "./pipeline-scheduler";
import type { ImportJobRecord, JobType } from "./types";
import { UploadValidationError } from "./upload-service";

/** Soft cap on files per bulk request (each file = one Import Session). */
export const MAX_BULK_FILES = 15;

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
  type: JobType | JobType[];
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
  /** When true, enqueue durable pipeline (never inline). */
  autoPipeline?: boolean;
  uploadMode?: "normal_pdf" | "images" | "merged_pdf" | null;
  paperCount?: number | null;
  createdBy?: string | null;
}

function resolveModeForFile(
  file: File,
  declared: ReturnType<typeof parseImportUploadMode>
): "normal_pdf" | "images" {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (declared === "merged_pdf") {
    throw new BulkUploadError(
      "MERGED_PDF_UNSUPPORTED",
      IMPORT_LIMIT_MESSAGES.mergedModeUnsupported
    );
  }
  if (isPdf) {
    if (!declared || declared === "images") {
      throw new BulkUploadError(
        "UPLOAD_MODE_REQUIRED",
        "PDF bulk uploads require uploadMode=normal_pdf."
      );
    }
    return "normal_pdf";
  }
  return "images";
}

/**
 * Creates one Import Session per file with the same validation as /upload.
 */
export async function processBulkUpload(
  input: BulkUploadInput
): Promise<
  BulkUploadResult & { schedules: Array<{ jobId: string; mode: string }> }
> {
  if (!input.files.length) {
    throw new BulkUploadError(
      "FILES_REQUIRED",
      "At least one file is required."
    );
  }

  if (input.files.length > MAX_BULK_FILES) {
    throw new BulkUploadError(
      "IMAGE_LIMIT_EXCEEDED",
      `Bulk upload supports a maximum of ${MAX_BULK_FILES} files per request.`
    );
  }

  const paperCount = input.paperCount ?? 1;
  if (
    !Number.isInteger(paperCount) ||
    paperCount < 1 ||
    paperCount > MAX_PAPERS_PER_IMPORT
  ) {
    throw new BulkUploadError(
      "PAPER_LIMIT_EXCEEDED",
      IMPORT_LIMIT_MESSAGES.papers
    );
  }

  const declaredMode = input.uploadMode
    ? parseImportUploadMode(input.uploadMode)
    : input.uploadMode;

  const jobs: ImportJobRecord[] = [];
  const failed: { filename: string; error: string }[] = [];
  const schedules: Array<{ jobId: string; mode: string }> = [];

  for (let index = 0; index < input.files.length; index += 1) {
    const file = input.files[index];
    const type = Array.isArray(input.type)
      ? (input.type[index] ?? input.type[0] ?? "bulk")
      : input.type;

    try {
      const uploadMode = resolveModeForFile(file, declaredMode ?? null);
      if (uploadMode === "images" && input.files.length > MAX_IMPORT_IMAGES) {
        // Per-session image batches are single-file here; multi-image sessions
        // must use /upload. Bulk is one session per file.
      }

      const job = await processImportSession({
        files: [file],
        type,
        branch: input.branch,
        semester: input.semester,
        subjectCode: input.subjectCode,
        uploadMode,
        paperCount,
        createdBy: input.createdBy ?? null,
      });
      jobs.push(job);
      await recordJobHistory(job.id);

      if (input.autoPipeline) {
        const schedule = await scheduleImportPipeline(job.id);
        schedules.push({ jobId: job.id, mode: schedule.mode });
      }
    } catch (error) {
      if (error instanceof UploadValidationError) {
        failed.push({ filename: file.name, error: error.message });
      } else if (error instanceof BulkUploadError) {
        failed.push({ filename: file.name, error: error.message });
      } else {
        failed.push({
          filename: file.name,
          error: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    }
  }

  const batch = await createBatchRecord({
    jobIds: jobs.map((job) => job.id),
    maxConcurrency: 1,
    autoPipeline: Boolean(input.autoPipeline),
  });

  return {
    batchId: batch.batchId,
    jobs,
    created: jobs.length,
    failed,
    schedules,
  };
}
