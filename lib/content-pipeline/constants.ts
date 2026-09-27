import type { ImportStatus, JobType, ValidationStatus } from "./types";
import {
  PipelineStage,
  type PipelineStage as PipelineStageValue,
} from "./pipeline-stage";

/** Local CMS route paths. */
export const CMS_ROUTES = {
  root: "/admin",
  content: "/admin/content",
} as const;

/** CMS upload API endpoint. */
export const CMS_UPLOAD_API = "/api/cms/upload";

/** CMS queue API endpoint. */
export const CMS_QUEUE_API = "/api/cms/queue";

/** CMS OCR API endpoint. */
export const CMS_OCR_API = "/api/cms/ocr";

/** Relative path for local CMS upload workspaces (never under content/). */
export const CMS_UPLOADS_DIR = ".cms/uploads";

/** Relative path for the local import queue index. */
export const CMS_QUEUE_DIR = ".cms/queue";

/** Queue index filename (job references only). */
export const CMS_QUEUE_FILENAME = "queue.json";

/** Stored original filename inside each job directory (extension appended). */
export const CMS_ORIGINAL_BASENAME = "original";

/** Directory for multi-image session pages under a job workspace. */
export const CMS_ORIGINALS_DIR = "originals";

/** Metadata filename written inside each job directory. */
export const CMS_METADATA_FILENAME = "metadata.json";

/** Pipeline state filename written inside each job directory. */
export const CMS_PIPELINE_FILENAME = "pipeline.json";

/** Raw OCR document filename inside each job directory. */
export const CMS_RAW_DOCUMENT_FILENAME = "raw-document.json";

/** Structured layout document filename inside each job directory. */
export const CMS_STRUCTURED_DOCUMENT_FILENAME = "structured-document.json";

/** Academic structuring document filename inside each job directory. */
export const CMS_ACADEMIC_DOCUMENT_FILENAME = "academic-document.json";

/** CMS layout detection API endpoint. */
export const CMS_LAYOUT_API = "/api/cms/layout";

/** CMS diagram extraction API endpoint. */
export const CMS_DIAGRAMS_API = "/api/cms/diagrams";

/** CMS Gemini structuring API endpoint. */
export const CMS_STRUCTURING_API = "/api/cms/structuring";

/** CMS schema builder API endpoint. */
export const CMS_SCHEMA_API = "/api/cms/schema";

/** CMS validation API endpoint. */
export const CMS_VALIDATION_API = "/api/cms/validation";

/** CMS writer API endpoint. */
export const CMS_WRITE_API = "/api/cms/write";

/** Production preview PYQ JSON filename inside each job directory. */
export const CMS_PRODUCTION_PYQS_FILENAME = "production-pyqs.json";

/** Production preview syllabus JSON filename inside each job directory. */
export const CMS_PRODUCTION_SYLLABUS_FILENAME = "production-syllabus.json";

/** Validation report filename inside each job directory. */
export const CMS_VALIDATION_REPORT_FILENAME = "validation-report.json";

/** Write report filename inside each job directory. */
export const CMS_WRITE_REPORT_FILENAME = "write-report.json";

/** Diagram manifest filename inside each job directory. */
export const CMS_DIAGRAM_MANIFEST_FILENAME = "diagram-manifest.json";

/** Pending merged PYQ JSON awaiting review approval. */
export const CMS_PENDING_PYQS_FILENAME = "pending-pyqs.json";

/** Pending merged syllabus JSON awaiting review approval. */
export const CMS_PENDING_SYLLABUS_FILENAME = "pending-syllabus.json";

/** Local save report filename inside each job directory. */
export const CMS_SAVE_REPORT_FILENAME = "save-report.json";

/** Review decision state filename inside each job directory. */
export const CMS_REVIEW_STATE_FILENAME = "review-state.json";

/** CMS review API endpoint. */
export const CMS_REVIEW_API = "/api/cms/review";

/** CMS local save API endpoint. */
export const CMS_SAVE_API = "/api/cms/save";

/** CMS git review API endpoint (read-only). */
export const CMS_GIT_API = "/api/cms/git";

/** CMS import history API endpoint. */
export const CMS_HISTORY_API = "/api/cms/history";

/** CMS recovery API endpoint. */
export const CMS_RECOVERY_API = "/api/cms/recovery";

/** CMS bulk upload API endpoint. */
export const CMS_BULK_API = "/api/cms/bulk";

/** CMS rebuild API endpoint. */
export const CMS_REBUILD_API = "/api/cms/rebuild";

/** Rebuild report filename inside each job directory. */
export const CMS_REBUILD_REPORT_FILENAME = "rebuild-report.json";

/** Prompt / structuring version tag recorded on rebuild reports. */
export const CMS_PROMPT_VERSION = "1.0.0";

/** Validation rules version tag recorded on rebuild reports. */
export const CMS_VALIDATION_VERSION = "1.0.0";

/** Active storage provider id (read-only display). */
export const CMS_STORAGE_PROVIDER_ID = "local";

/** Active storage provider label for the admin dashboard. */
export const CMS_STORAGE_PROVIDER_LABEL = "Local Repository";

/** Relative path for permanent import history records. */
export const CMS_HISTORY_DIR = ".cms/history";

/** Relative path for bulk batch metadata. */
export const CMS_BATCHES_DIR = ".cms/batches";

/** Default max concurrent bulk pipeline jobs. */
export const CMS_DEFAULT_BULK_CONCURRENCY = 3;

/** Subdirectories inside a job workspace. */
export const CMS_JOB_PAGES_DIR = "pages";
export const CMS_JOB_IMAGES_DIR = "images";
export const CMS_JOB_TABLES_DIR = "tables";
export const CMS_JOB_DIAGRAMS_DIR = "diagrams";

/** Maximum accepted upload size (50 MiB). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Human-readable labels for job types. */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  syllabus: "Syllabus",
  pyq: "PYQ Paper",
  diagram: "Diagram",
  bulk: "Bulk Upload",
};

/** Human-readable labels for import status. */
export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  awaiting_review: "Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Human-readable labels for pipeline stages. */
export const PIPELINE_STAGE_LABELS: Record<PipelineStageValue, string> = {
  [PipelineStage.UPLOADED]: "Uploaded",
  [PipelineStage.QUEUED]: "Queued",
  [PipelineStage.OCR_PROCESSING]: "OCR Processing",
  [PipelineStage.OCR_COMPLETED]: "OCR Completed",
  [PipelineStage.LAYOUT_PROCESSING]: "Layout Processing",
  [PipelineStage.LAYOUT_COMPLETED]: "Layout Completed",
  [PipelineStage.DIAGRAM_EXTRACTION]: "Diagram Extraction",
  [PipelineStage.DIAGRAMS_READY]: "Diagrams Ready",
  [PipelineStage.STRUCTURING]: "Structuring",
  [PipelineStage.STRUCTURED]: "Structured",
  [PipelineStage.SCHEMA_BUILDING]: "Schema Building",
  [PipelineStage.SCHEMA_READY]: "Schema Ready",
  [PipelineStage.VALIDATING]: "Validating",
  [PipelineStage.VALIDATED]: "Validated",
  [PipelineStage.WRITING]: "Writing",
  [PipelineStage.DIAGRAMS_WRITING]: "Diagrams Writing",
  [PipelineStage.DIAGRAMS_WRITTEN]: "Diagrams Written",
  [PipelineStage.WRITTEN]: "Written",
  [PipelineStage.UNDER_REVIEW]: "Under Review",
  [PipelineStage.APPROVED]: "Approved",
  [PipelineStage.LOCAL_SAVED]: "Local Saved",
  [PipelineStage.REBUILDING]: "Rebuilding",
  [PipelineStage.REBUILT]: "Rebuilt",
  [PipelineStage.COMPLETED]: "Completed",
  [PipelineStage.FAILED]: "Failed",
  [PipelineStage.TIMEOUT]: "Timed Out",
  [PipelineStage.CANCELLED]: "Cancelled",
};

/** Human-readable labels for validation status. */
export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
  warnings: "Warnings",
};

/** Queue statuses that may appear in queue.json. */
export const QUEUE_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

/**
 * Accepted upload MIME types.
 * Validation uses MIME type only — not file extension.
 */
export const ACCEPTED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/tiff",
] as const;

export type AcceptedUploadMimeType =
  (typeof ACCEPTED_UPLOAD_MIME_TYPES)[number];

/** Accepted upload file extensions (UI accept= attribute only). */
export const ACCEPTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
] as const;

/** Valid job types accepted by the upload API. */
export const ACCEPTED_JOB_TYPES: readonly JobType[] = [
  "syllabus",
  "pyq",
  "diagram",
  "bulk",
] as const;
