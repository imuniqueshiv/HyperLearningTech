/**
 * Import history and operations types.
 */

import type { ImportStatus, JobType, ValidationStatus } from "./types";
import type { PipelineStage } from "./pipeline-stage";

export type StageOutcome = "Success" | "Failure" | "Skipped" | "Cancelled";

export interface StageFailureRecord {
  stage: PipelineStage | string;
  reason: string;
  stack: string | null;
  timestamp: string;
  outcome: StageOutcome;
}

export interface ImportHistoryRecord {
  jobId: string;
  importDate: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  uploadedFile: string;
  operator: string;
  pipelineType: "local-cms";
  branch: string | null;
  semester: string | null;
  subject: string | null;
  jobType: JobType;
  status: ImportStatus;
  stage: PipelineStage;
  stagesCompleted: PipelineStage[];
  questionsImported: number;
  topicsImported: number;
  diagramsImported: number;
  filesModified: string[];
  warnings: number;
  errors: number;
  validationResult: ValidationStatus | "unknown";
  writerResult: "SUCCESS" | "FAILED" | "pending" | "none";
  reviewResult: string | null;
  saveResult: "SUCCESS" | "FAILED" | "pending" | "none";
  progressPercent: number;
  lastFailure: StageFailureRecord | null;
  updatedAt: string;
}

export interface HistoryListFilters {
  search?: string;
  status?: ImportStatus | "all";
  jobType?: JobType | "all";
  branch?: string | null;
  semester?: string | null;
  subject?: string | null;
  sort?: "newest" | "oldest" | "duration" | "status";
}

export interface HistoryListResult {
  records: ImportHistoryRecord[];
  total: number;
}

export interface RecoveryActionResult {
  jobId: string;
  action: "retry" | "rollback";
  stageRetried: string | null;
  restoredFiles: string[];
  success: boolean;
  message: string;
}

export interface BulkUploadResult {
  batchId: string;
  jobs: import("./types").ImportJobRecord[];
  created: number;
  failed: { filename: string; error: string }[];
}

export interface BatchProgressItem {
  jobId: string;
  filename: string;
  status: ImportStatus;
  stage: PipelineStage;
  progressPercent: number;
  error: string | null;
}

export interface BatchStatus {
  batchId: string;
  createdAt: string;
  maxConcurrency: number;
  jobIds: string[];
  running: number;
  queued: number;
  completed: number;
  failed: number;
  cancelled: number;
  items: BatchProgressItem[];
}
