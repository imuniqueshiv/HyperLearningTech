/**
 * Content pipeline type definitions.
 *
 * These types define the CMS job model for future phases.
 * No business logic lives here — interfaces and enums only.
 */

import type { StructuringRunSummary } from "./academic-document";
import type {
  SchemaBuildRunSummary,
  ValidationReport,
  ValidationRunSummary,
} from "./schema-types";
import type { DiagramRunSummary } from "./diagram-metadata";
import type { OcrRunSummary } from "./raw-document";
import type { LayoutRunSummary } from "./structured-document";
import type { PipelineStage } from "./pipeline-stage";
import type { RebuildRunSummary } from "./rebuild-types";
import type { ReviewRunSummary, SaveRunSummary } from "./review-types";
import type { WriteReport, WritingRunSummary } from "./write-report";

/** High-level kind of content being imported. */
export type JobType = "syllabus" | "pyq" | "diagram" | "bulk";

/**
 * Exam session for PYQ imports (maps to paper month).
 * Repository sittings include November as well as June/December.
 */
export type ExamSession = "June" | "November" | "December";

/**
 * One uploaded source file within an Import Session.
 * Multiple images = pages of one academic document.
 */
export interface SourceFileRef {
  /** Absolute path inside the job workspace. */
  absolutePath: string;
  /** Path relative to the job directory. */
  relativePath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  /** 1-based page order for multi-image sessions. */
  pageNumber: number;
}

/**
 * Simplified CMS status shown in the Import Session UI.
 * Internal PipelineStage values remain for stage services.
 */
export type ImportSessionStatus =
  | "Queued"
  | "Running"
  | "Review Ready"
  | "Completed"
  | "Failed";

/**
 * Lifecycle status of an import job.
 */
export type ImportStatus =
  | "queued"
  | "processing"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "failed"
  | "completed"
  | "cancelled";

/**
 * Statuses persisted in `.cms/queue/queue.json` entries.
 * Full job detail lives in each job folder.
 */
export type QueueStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** Outcome of schema / content validation. */
export type ValidationStatus = "pending" | "passed" | "failed" | "warnings";

/** Severity of a validation finding. */
export type ValidationSeverity = "error" | "warning" | "info";

/** A single validation finding attached to a job. */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

/** Content target path within the repository. */
export interface ContentTarget {
  university: string;
  branch: string;
  semester: string;
  subject: string;
}

/**
 * Dashboard / legacy list row shape.
 */
export interface ContentImportJob {
  id: string;
  type: JobType;
  status: ImportStatus;
  stage: PipelineStage;
  validationStatus: ValidationStatus;
  target: ContentTarget;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  issues?: ValidationIssue[];
}

/**
 * Lightweight queue reference stored in `.cms/queue/queue.json`.
 * Complete job state lives in the job folder.
 */
export interface QueueEntry {
  jobId: string;
  status: QueueStatus;
}

/**
 * Persistable pipeline state written to
 * `.cms/uploads/<jobId>/pipeline.json`.
 */
export interface PipelineState {
  jobId: string;
  stage: PipelineStage;
  status: ImportStatus;
  enqueuedAt: string;
  updatedAt: string;
  error: string | null;
  ocr?: OcrRunSummary | null;
  layout?: LayoutRunSummary | null;
  diagrams?: DiagramRunSummary | null;
  structuring?: StructuringRunSummary | null;
  schema?: SchemaBuildRunSummary | null;
  validation?: ValidationRunSummary | null;
  writing?: WritingRunSummary | null;
  review?: ReviewRunSummary | null;
  save?: SaveRunSummary | null;
  rebuild?: RebuildRunSummary | null;
}

/**
 * Persistable upload job metadata written to
 * `.cms/uploads/<jobId>/metadata.json`.
 */
export interface UploadJobMetadata {
  jobId: string;
  type: JobType;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  status: ImportStatus;
  stage: PipelineStage;
  validationStatus: ValidationStatus;
  branch: string | null;
  semester: string | null;
  subjectCode: string | null;
  /** PYQ year provided at import time (optional for syllabus). */
  year: number | null;
  /** PYQ exam session provided at import time. */
  examSession: ExamSession | null;
  /** Auto-extracted metadata with confidence/source. */
  extractedMetadata?:
    | import("./metadata-extractor").ExtractedImportMetadata
    | null;
  /** Fields the administrator set explicitly and must not be overwritten. */
  manualOverrides?: Partial<{
    branch: boolean;
    semester: boolean;
    subjectCode: boolean;
    year: boolean;
    examSession: boolean;
  }>;
  error: string | null;
  /** Absolute filesystem path to the job workspace directory. */
  temporaryPath: string;
  /** Absolute filesystem path to the primary original file (PDF or first image). */
  originalFilePath: string;
  /**
   * All source files for this Import Session.
   * One PDF → single entry. Multiple images → ordered pages.
   */
  sourceFiles: SourceFileRef[];
}

/**
 * Hydrated import job returned by the queue API and upload response.
 */
export interface ImportJobRecord {
  id: string;
  type: JobType;
  status: ImportStatus;
  stage: PipelineStage;
  branch: string | null;
  semester: string | null;
  subjectCode: string | null;
  year: number | null;
  examSession: ExamSession | null;
  extractedMetadata?:
    | import("./metadata-extractor").ExtractedImportMetadata
    | null;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  temporaryPath: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  validationStatus: ValidationStatus;
  sourceFiles?: SourceFileRef[];
  ocr?: OcrRunSummary | null;
  layout?: LayoutRunSummary | null;
  diagrams?: DiagramRunSummary | null;
  structuring?: StructuringRunSummary | null;
  schema?: SchemaBuildRunSummary | null;
  validation?: ValidationRunSummary | null;
  writing?: WritingRunSummary | null;
  review?: ReviewRunSummary | null;
  save?: SaveRunSummary | null;
  rebuild?: RebuildRunSummary | null;
}

/** Successful upload API payload returned to the admin UI. */
export interface UploadSuccessResult {
  success: true;
  job: ImportJobRecord;
}

/** Failed upload API payload. */
export interface UploadErrorResult {
  success: false;
  error: string;
  code?: string;
}

export type UploadApiResult = UploadSuccessResult | UploadErrorResult;

/** Successful queue list API payload. */
export interface QueueListSuccessResult {
  success: true;
  jobs: ImportJobRecord[];
}

export type QueueListApiResult = QueueListSuccessResult | UploadErrorResult;

/** Successful OCR API payload. */
export interface OcrSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: OcrRunSummary;
}

export type OcrApiResult = OcrSuccessResult | UploadErrorResult;

/** Successful layout API payload. */
export interface LayoutSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: LayoutRunSummary;
}

export type LayoutApiResult = LayoutSuccessResult | UploadErrorResult;

/** Successful diagram extraction API payload. */
export interface DiagramSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: DiagramRunSummary;
}

export type DiagramApiResult = DiagramSuccessResult | UploadErrorResult;

/** Successful structuring API payload. */
export interface StructuringSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: StructuringRunSummary;
}

export type StructuringApiResult = StructuringSuccessResult | UploadErrorResult;

/** Successful schema build API payload. */
export interface SchemaBuildSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: SchemaBuildRunSummary;
}

export type SchemaBuildApiResult = SchemaBuildSuccessResult | UploadErrorResult;

/** Successful validation API payload. */
export interface ValidationSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: ValidationRunSummary;
  report: ValidationReport;
}

export type ValidationApiResult = ValidationSuccessResult | UploadErrorResult;

/** Successful writer API payload. */
export interface WriteSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: WritingRunSummary;
  report: WriteReport;
}

export type WriteApiResult = WriteSuccessResult | UploadErrorResult;

/** Successful review API payload. */
export interface ReviewSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: ReviewRunSummary;
  review?: import("./review-types").ReviewSummary;
  package?: import("./review-types").ReviewPackage;
}

export type ReviewApiResult = ReviewSuccessResult | UploadErrorResult;

/** Successful local save API payload. */
export interface SaveSuccessResult {
  success: true;
  job: ImportJobRecord;
  summary: SaveRunSummary;
  report: import("./review-types").SaveReport;
}

export type SaveApiResult = SaveSuccessResult | UploadErrorResult;

/** Successful git review API payload. */
export interface GitReviewSuccessResult {
  success: true;
  snapshot: import("./review-types").GitReviewSnapshot;
}

export type GitReviewApiResult = GitReviewSuccessResult | UploadErrorResult;

/**
 * Future pipeline orchestrator contract.
 * Implementations belong to later phases.
 */
export interface ContentPipeline {
  enqueue(
    job: Omit<ContentImportJob, "id" | "createdAt" | "updatedAt">
  ): Promise<ContentImportJob>;
  getJob(id: string): Promise<ContentImportJob | null>;
  listJobs(): Promise<ContentImportJob[]>;
}
