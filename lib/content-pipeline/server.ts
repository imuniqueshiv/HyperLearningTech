/**
 * Server-only content-pipeline exports.
 * Import from `@/lib/content-pipeline/server` in API routes / Node code only.
 */

export { generateJobId } from "./job-id";

export {
  createJobDirectory,
  ensureCmsUploadsDir,
  getCmsUploadsRoot,
  getJobDirectory,
  saveOriginalFile,
  saveOriginalPages,
} from "./temp-storage";

export {
  createInitialPipelineState,
  createUploadMetadata,
  getMetadataPath,
  getPipelinePath,
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
  writeJobMetadata,
  writePipelineState,
} from "./job-manager";

export {
  asQueueStatus,
  dequeueJob,
  enqueueJob,
  getJob,
  listJobs,
  toImportJobRecord,
  updateJobStatus,
} from "./import-queue";

export {
  processUpload,
  UploadValidationError,
  type ProcessUploadInput,
} from "./upload-service";

export {
  processImportSession,
  startImportSessionPipeline,
  ensureImportSessionPipeline,
  openSessionForReview,
  classifySessionFiles,
  type ProcessImportSessionInput,
} from "./import-session-service";

export {
  superviseJobPipeline,
  inferResumeStage,
  type SupervisorMode,
} from "./pipeline-supervisor";

export {
  getPipelineDebugSnapshot,
  type PipelineDebugSnapshot,
} from "./pipeline-debug";

export {
  STAGE_TIMEOUT_MS,
  StageTimeoutError,
  timedAwait,
  withStageTimeout,
} from "./stage-runtime";

export {
  getImportSessionStatus,
  getSessionStepStates,
  getSessionProgressLabel,
  sessionStatusTone,
  IMPORT_SESSION_STEPS,
} from "./session-status";

export type { OcrEngine } from "./ocr-engine";
export { LocalOcrEngine, createDefaultOcrEngine } from "./local-ocr-engine";
export {
  getRawDocumentPath,
  OcrProcessingError,
  readRawDocument,
  runOcrForJob,
  writeRawDocument,
  type RunOcrResult,
} from "./ocr-service";

export { detectLayout } from "./layout-detector";
export {
  getStructuredDocumentPath,
  LayoutProcessingError,
  readStructuredDocument,
  runLayoutForJob,
  writeStructuredDocument,
  type RunLayoutResult,
} from "./layout-service";

export {
  DiagramProcessingError,
  runDiagramsForJob,
  type RunDiagramsResult,
} from "./diagram-service";

export type { StructuringEngine } from "./gemini-structuring";
export {
  GeminiStructuringEngine,
  createDefaultStructuringEngine,
} from "./gemini-structuring";
export {
  getAcademicDocumentPath,
  readAcademicDocument,
  runStructuringForJob,
  StructuringProcessingError,
  writeAcademicDocument,
  type RunStructuringResult,
} from "./structuring-service";

export {
  getProductionPyqsPath,
  getProductionSyllabusPath,
  readProductionPyqs,
  readProductionSyllabus,
  runSchemaBuildForJob,
  SchemaBuildProcessingError,
  type RunSchemaBuildResult,
} from "./schema-builder-service";

export {
  getValidationReportPath,
  readValidationReport,
  runValidationForJob,
  ValidationProcessingError,
  type RunValidationResult,
} from "./validation-service";

export {
  getJobDiagramManifestPath,
  getSubjectContentDir,
  getWriteReportPath,
  readJobDiagramManifest,
  readWriteReport,
  runWriterForJob,
  WriterProcessingError,
  type RunWriterResult,
} from "./writer-service";

export {
  getReviewPackage,
  startReviewForJob,
  submitReviewDecision,
  ReviewProcessingError,
  type ReviewDecisionResult,
} from "./review-service";

export {
  getSaveReportPath,
  readSaveReport,
  runLocalSaveForJob,
  SaveProcessingError,
  type RunLocalSaveResult,
} from "./local-save-service";

export {
  buildManualGitCommands,
  captureGitReview,
  GitReviewError,
} from "./git-review";

export {
  buildHistoryRecord,
  getImportHistory,
  HistoryProcessingError,
  listImportHistory,
  recordJobHistory,
  syncHistoryFromQueue,
  writeHistoryFilesModified,
} from "./history-service";

export {
  listHistoryRecords,
  readHistoryRecord,
  writeHistoryRecord,
} from "./history-storage";

export {
  appendStageFailure,
  createStageFailure,
  handleStageFailure,
  readFailureLog,
} from "./failure-handler";

export { rollbackLocalSave, RollbackProcessingError } from "./rollback-service";

export {
  inferRetryStage,
  retryFailedStage,
  JobRecoveryError,
  type RecoverableStage,
} from "./job-recovery";

export { RecoveryProcessingError, runRecoveryAction } from "./recovery-service";

export { runWithConcurrency } from "./parallel-runner";

export {
  createBatchRecord,
  getBatchStatus,
  readBatchRecord,
} from "./bulk-job-manager";

export { runBatchPipeline, type BatchPipelineMode } from "./batch-service";

export {
  BulkUploadError,
  processBulkUpload,
  type BulkUploadInput,
} from "./bulk-upload-service";

export {
  canRebuildJob,
  readRebuildReport,
  RebuildProcessingError,
  runRebuildForJob,
  runRebuildForJobs,
  type RebuildMode,
  type RebuildResult,
  type RebuildReport,
} from "./rebuild-service";

export {
  getConfiguredStorageProviderInfo,
  getStorageProvider,
  getStorageProviderInfo,
  setStorageProvider,
} from "./storage-factory";

export { LocalStorageProvider } from "./local-storage-provider";
export type {
  ContentStorageProvider,
  StorageProviderInfo,
} from "./storage-types";
