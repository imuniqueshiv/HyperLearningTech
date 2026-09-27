/**
 * Client-safe content-pipeline exports.
 *
 * Server-only modules (fs / Node crypto / OCR engines) must be imported
 * from their own files or from `./server` — never from this barrel.
 */

export type {
  ContentImportJob,
  ContentPipeline,
  ContentTarget,
  ExamSession,
  ImportJobRecord,
  ImportSessionStatus,
  ImportStatus,
  JobType,
  LayoutApiResult,
  LayoutSuccessResult,
  DiagramApiResult,
  DiagramSuccessResult,
  StructuringApiResult,
  StructuringSuccessResult,
  SchemaBuildApiResult,
  SchemaBuildSuccessResult,
  ValidationApiResult,
  ValidationSuccessResult,
  WriteApiResult,
  WriteSuccessResult,
  ReviewApiResult,
  ReviewSuccessResult,
  SaveApiResult,
  SaveSuccessResult,
  GitReviewApiResult,
  GitReviewSuccessResult,
  OcrApiResult,
  OcrSuccessResult,
  PipelineState,
  QueueEntry,
  QueueListApiResult,
  QueueListSuccessResult,
  QueueStatus,
  SourceFileRef,
  UploadApiResult,
  UploadErrorResult,
  UploadJobMetadata,
  UploadSuccessResult,
  ValidationIssue,
  ValidationSeverity,
  ValidationStatus,
} from "./types";

export { PIPELINE_STAGE_ORDER, PipelineStage } from "./pipeline-stage";

export type { BoundingBox, Point } from "./coordinates";

export type { LayoutBlock, LayoutBlockKind, PageLayout } from "./layout";

export type {
  OcrRunSummary,
  RawDocument,
  RawImageRef,
  RawPage,
  RawTable,
  RawTableCell,
  RawTextBlock,
} from "./raw-document";

export type {
  LayoutRunSummary,
  StructureFigureNode,
  StructureNode,
  StructureNodeKind,
  StructurePageNode,
  StructureTableNode,
  StructureTextNode,
  StructuredDocument,
  StructuredDocumentMetadata,
} from "./structured-document";

export type { DiagramAsset, DiagramRunSummary } from "./diagram-metadata";

export type {
  AcademicDocument,
  StructuringRunSummary,
} from "./academic-document";

export type {
  AcademicAttachment,
  AcademicDiagram,
  AcademicExam,
  AcademicMetadata,
  AcademicQuestion,
  AcademicSubQuestion,
  AcademicTopic,
  AcademicUnit,
} from "./academic-types";

export type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  SchemaBuildRunSummary,
  ValidationReport,
  ValidationRunSummary,
} from "./schema-types";

export type { WriteReport, WritingRunSummary } from "./write-report";

export type { DiagramManifest, DiagramManifestEntry } from "./diagram-manifest";

export type { DiagramWriteStats } from "./diagram-write-report";

export type {
  DiffChangeKind,
  GitFileChange,
  GitReviewSnapshot,
  JsonDiffEntry,
  JsonDiffResult,
  ReviewDecision,
  ReviewPackage,
  ReviewRunSummary,
  ReviewSummary,
  SaveReport,
  SaveRunSummary,
} from "./review-types";

export type {
  BatchProgressItem,
  BatchStatus,
  BulkUploadResult,
  HistoryListFilters,
  HistoryListResult,
  ImportHistoryRecord,
  RecoveryActionResult,
  StageFailureRecord,
  StageOutcome,
} from "./history-types";

export type {
  RebuildMode,
  RebuildReport,
  RebuildResult,
  RebuildRunSummary,
} from "./rebuild-types";

export type {
  ContentStorageProvider,
  StorageProviderInfo,
} from "./storage-types";

export { progressPercentForStage } from "./progress";

export {
  ACCEPTED_JOB_TYPES,
  ACCEPTED_UPLOAD_EXTENSIONS,
  ACCEPTED_UPLOAD_MIME_TYPES,
  CMS_ACADEMIC_DOCUMENT_FILENAME,
  CMS_DIAGRAMS_API,
  CMS_JOB_DIAGRAMS_DIR,
  CMS_JOB_IMAGES_DIR,
  CMS_JOB_PAGES_DIR,
  CMS_JOB_TABLES_DIR,
  CMS_LAYOUT_API,
  CMS_METADATA_FILENAME,
  CMS_OCR_API,
  CMS_ORIGINAL_BASENAME,
  CMS_PIPELINE_FILENAME,
  CMS_PRODUCTION_PYQS_FILENAME,
  CMS_PRODUCTION_SYLLABUS_FILENAME,
  CMS_QUEUE_API,
  CMS_QUEUE_DIR,
  CMS_QUEUE_FILENAME,
  CMS_RAW_DOCUMENT_FILENAME,
  CMS_ROUTES,
  CMS_SCHEMA_API,
  CMS_STRUCTURED_DOCUMENT_FILENAME,
  CMS_STRUCTURING_API,
  CMS_UPLOAD_API,
  CMS_UPLOADS_DIR,
  CMS_VALIDATION_API,
  CMS_VALIDATION_REPORT_FILENAME,
  CMS_WRITE_API,
  CMS_WRITE_REPORT_FILENAME,
  CMS_DIAGRAM_MANIFEST_FILENAME,
  CMS_PENDING_PYQS_FILENAME,
  CMS_PENDING_SYLLABUS_FILENAME,
  CMS_SAVE_REPORT_FILENAME,
  CMS_REVIEW_STATE_FILENAME,
  CMS_REVIEW_API,
  CMS_SAVE_API,
  CMS_GIT_API,
  CMS_HISTORY_API,
  CMS_RECOVERY_API,
  CMS_BULK_API,
  CMS_REBUILD_API,
  CMS_REBUILD_REPORT_FILENAME,
  CMS_PROMPT_VERSION,
  CMS_VALIDATION_VERSION,
  CMS_STORAGE_PROVIDER_ID,
  CMS_STORAGE_PROVIDER_LABEL,
  CMS_HISTORY_DIR,
  CMS_BATCHES_DIR,
  CMS_DEFAULT_BULK_CONCURRENCY,
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  MAX_UPLOAD_BYTES,
  PIPELINE_STAGE_LABELS,
  QUEUE_STATUSES,
  VALIDATION_STATUS_LABELS,
} from "./constants";

export type { AcceptedUploadMimeType } from "./constants";

export type {
  ExtractedField,
  ExtractedImportMetadata,
  MetadataSource,
  SubjectCatalogEntry,
} from "./metadata-extractor";

export {
  getExtensionForMimeType,
  isSupportedMimeType,
  normalizeMimeType,
} from "./mime";

export { formatFileSize, isJobType, validateUploadConstraints } from "./utils";

export {
  getImportSessionStatus,
  getSessionProgressLabel,
  getSessionStepStates,
  IMPORT_SESSION_STEPS,
  sessionStatusTone,
} from "./session-status";

export type { ImportSessionStepId, SessionStepState } from "./session-status";
