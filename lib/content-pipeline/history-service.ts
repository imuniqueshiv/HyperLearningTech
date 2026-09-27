/**
 * Builds and queries permanent import history records.
 */

import { listJobs, getJob } from "./import-queue";
import {
  listHistoryRecords,
  readHistoryRecord,
  writeHistoryRecord,
} from "./history-storage";
import type {
  HistoryListFilters,
  HistoryListResult,
  ImportHistoryRecord,
  StageFailureRecord,
} from "./history-types";
import { PipelineStage, PIPELINE_STAGE_ORDER } from "./pipeline-stage";
import { progressPercentForStage } from "./progress";
import type { ImportJobRecord } from "./types";

export class HistoryProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HistoryProcessingError";
    this.code = code;
  }
}

/**
 * Builds a history record from a live ImportJobRecord.
 */
export function buildHistoryRecord(
  job: ImportJobRecord,
  failure?: StageFailureRecord | null
): ImportHistoryRecord {
  const startedAt = job.ocr?.startedAt ?? job.createdAt;
  const completedAt =
    job.save?.completedAt ??
    job.review?.completedAt ??
    job.writing?.completedAt ??
    (job.status === "completed" || job.status === "failed"
      ? job.updatedAt
      : null);

  const durationMs = completedAt
    ? Math.max(0, Date.parse(completedAt) - Date.parse(startedAt))
    : null;

  const stagesCompleted = PIPELINE_STAGE_ORDER.filter((stage) =>
    isStageCompleted(job, stage)
  );

  return {
    jobId: job.id,
    importDate: job.createdAt.slice(0, 10),
    startedAt,
    completedAt,
    durationMs,
    uploadedFile: job.originalFilename,
    operator: "local-admin",
    pipelineType: "local-cms",
    branch: job.branch,
    semester: job.semester,
    subject: job.subjectCode,
    jobType: job.type,
    status: job.status,
    stage: job.stage,
    stagesCompleted,
    questionsImported:
      job.save?.filesUpdated != null
        ? (job.writing?.questionsAdded ?? 0)
        : (job.writing?.questionsAdded ?? job.schema?.questionCount ?? 0),
    topicsImported: job.writing?.topicsAdded ?? job.schema?.topicCount ?? 0,
    diagramsImported:
      job.save?.diagramsCopied ??
      job.writing?.diagramsCopied ??
      job.diagrams?.diagramCount ??
      0,
    filesModified: [],
    warnings: job.validation?.warningCount ?? job.writing?.warningCount ?? 0,
    errors:
      job.validation?.errorCount ??
      job.writing?.errorCount ??
      (job.error ? 1 : 0),
    validationResult: job.validationStatus ?? "unknown",
    writerResult: job.writing
      ? job.writing.status
      : job.stage === PipelineStage.WRITTEN ||
          job.stage === PipelineStage.UNDER_REVIEW ||
          job.stage === PipelineStage.APPROVED ||
          job.stage === PipelineStage.LOCAL_SAVED
        ? "SUCCESS"
        : "none",
    reviewResult: job.review?.decision ?? null,
    saveResult: job.save
      ? job.save.status
      : job.stage === PipelineStage.LOCAL_SAVED
        ? "SUCCESS"
        : "none",
    progressPercent:
      job.stage === PipelineStage.FAILED
        ? progressPercentForStage(
            stagesCompleted[stagesCompleted.length - 1] ?? PipelineStage.QUEUED
          )
        : progressPercentForStage(job.stage),
    lastFailure: failure ?? null,
    updatedAt: job.updatedAt,
  };
}

/**
 * Upserts history for a job from live queue state.
 */
export async function recordJobHistory(
  jobId: string,
  failure?: StageFailureRecord | null
): Promise<ImportHistoryRecord> {
  const job = await getJob(jobId);
  if (!job) {
    throw new HistoryProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  const existing = await readHistoryRecord(jobId);
  const record = buildHistoryRecord(job, failure ?? existing?.lastFailure);
  if (existing?.filesModified?.length) {
    record.filesModified = existing.filesModified;
  }
  await writeHistoryRecord(record);
  return record;
}

/**
 * Syncs history entries for all known jobs (idempotent).
 */
export async function syncHistoryFromQueue(): Promise<ImportHistoryRecord[]> {
  const jobs = await listJobs();
  const records: ImportHistoryRecord[] = [];

  for (const job of jobs) {
    const record = await recordJobHistory(job.id);
    records.push(record);
  }

  return records;
}

/**
 * Lists history with search / filter / sort.
 */
export async function listImportHistory(
  filters: HistoryListFilters = {}
): Promise<HistoryListResult> {
  await syncHistoryFromQueue();
  let records = await listHistoryRecords();

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    records = records.filter(
      (record) =>
        record.jobId.toLowerCase().includes(search) ||
        record.uploadedFile.toLowerCase().includes(search) ||
        (record.subject ?? "").toLowerCase().includes(search) ||
        (record.branch ?? "").toLowerCase().includes(search) ||
        (record.semester ?? "").toLowerCase().includes(search)
    );
  }

  if (filters.status && filters.status !== "all") {
    records = records.filter((record) => record.status === filters.status);
  }

  if (filters.jobType && filters.jobType !== "all") {
    records = records.filter((record) => record.jobType === filters.jobType);
  }

  if (filters.branch) {
    records = records.filter(
      (record) =>
        (record.branch ?? "").toLowerCase() === filters.branch!.toLowerCase()
    );
  }

  if (filters.semester) {
    records = records.filter(
      (record) =>
        (record.semester ?? "").toLowerCase() ===
        filters.semester!.toLowerCase()
    );
  }

  if (filters.subject) {
    records = records.filter(
      (record) =>
        (record.subject ?? "").toLowerCase() === filters.subject!.toLowerCase()
    );
  }

  const sort = filters.sort ?? "newest";
  records = [...records].sort((a, b) => {
    if (sort === "oldest") {
      return Date.parse(a.startedAt) - Date.parse(b.startedAt);
    }
    if (sort === "duration") {
      return (b.durationMs ?? 0) - (a.durationMs ?? 0);
    }
    if (sort === "status") {
      return a.status.localeCompare(b.status);
    }
    return Date.parse(b.startedAt) - Date.parse(a.startedAt);
  });

  return { records, total: records.length };
}

export async function getImportHistory(
  jobId: string
): Promise<ImportHistoryRecord | null> {
  const existing = await readHistoryRecord(jobId);
  if (existing) {
    return existing;
  }
  try {
    return await recordJobHistory(jobId);
  } catch {
    return null;
  }
}

/**
 * Updates filesModified on an existing history record after Local Save.
 */
export async function writeHistoryFilesModified(
  jobId: string,
  filesModified: string[]
): Promise<ImportHistoryRecord | null> {
  const record = await recordJobHistory(jobId);
  record.filesModified = [...new Set(filesModified)];
  await writeHistoryRecord(record);
  return record;
}

function isStageCompleted(job: ImportJobRecord, stage: PipelineStage): boolean {
  switch (stage) {
    case PipelineStage.QUEUED:
    case PipelineStage.UPLOADED:
      return true;
    case PipelineStage.OCR_COMPLETED:
      return Boolean(job.ocr);
    case PipelineStage.LAYOUT_COMPLETED:
      return Boolean(job.layout);
    case PipelineStage.DIAGRAMS_READY:
      return Boolean(job.diagrams);
    case PipelineStage.STRUCTURED:
      return Boolean(job.structuring);
    case PipelineStage.SCHEMA_READY:
      return Boolean(job.schema);
    case PipelineStage.VALIDATED:
      return Boolean(job.validation);
    case PipelineStage.WRITTEN:
      return Boolean(job.writing);
    case PipelineStage.UNDER_REVIEW:
      return Boolean(job.review);
    case PipelineStage.APPROVED:
      return job.review?.decision === "approve";
    case PipelineStage.LOCAL_SAVED:
      return Boolean(job.save?.status === "SUCCESS");
    case PipelineStage.REBUILDING:
      return Boolean(job.rebuild);
    case PipelineStage.REBUILT:
      return (
        job.stage === PipelineStage.REBUILT ||
        Boolean(job.rebuild?.status === "SUCCESS")
      );
    case PipelineStage.COMPLETED:
      return job.status === "completed";
    default:
      return false;
  }
}
