/**
 * Canonical pipeline stages shared by every CMS phase.
 * Use these constants instead of inventing ad-hoc stage strings.
 */
export const PipelineStage = {
  UPLOADED: "UPLOADED",
  QUEUED: "QUEUED",
  OCR_PROCESSING: "OCR_PROCESSING",
  OCR_COMPLETED: "OCR_COMPLETED",
  LAYOUT_PROCESSING: "LAYOUT_PROCESSING",
  LAYOUT_COMPLETED: "LAYOUT_COMPLETED",
  DIAGRAM_EXTRACTION: "DIAGRAM_EXTRACTION",
  DIAGRAMS_READY: "DIAGRAMS_READY",
  STRUCTURING: "STRUCTURING",
  STRUCTURED: "STRUCTURED",
  SCHEMA_BUILDING: "SCHEMA_BUILDING",
  SCHEMA_READY: "SCHEMA_READY",
  VALIDATING: "VALIDATING",
  VALIDATED: "VALIDATED",
  WRITING: "WRITING",
  DIAGRAMS_WRITING: "DIAGRAMS_WRITING",
  DIAGRAMS_WRITTEN: "DIAGRAMS_WRITTEN",
  WRITTEN: "WRITTEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  LOCAL_SAVED: "LOCAL_SAVED",
  REBUILDING: "REBUILDING",
  REBUILT: "REBUILT",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  TIMEOUT: "TIMEOUT",
  CANCELLED: "CANCELLED",
} as const;

export type PipelineStage = (typeof PipelineStage)[keyof typeof PipelineStage];

/** Ordered stage sequence for monitoring and future workers. */
export const PIPELINE_STAGE_ORDER: readonly PipelineStage[] = [
  PipelineStage.UPLOADED,
  PipelineStage.QUEUED,
  PipelineStage.OCR_PROCESSING,
  PipelineStage.OCR_COMPLETED,
  PipelineStage.LAYOUT_PROCESSING,
  PipelineStage.LAYOUT_COMPLETED,
  PipelineStage.DIAGRAM_EXTRACTION,
  PipelineStage.DIAGRAMS_READY,
  PipelineStage.STRUCTURING,
  PipelineStage.STRUCTURED,
  PipelineStage.SCHEMA_BUILDING,
  PipelineStage.SCHEMA_READY,
  PipelineStage.VALIDATING,
  PipelineStage.VALIDATED,
  PipelineStage.WRITING,
  PipelineStage.DIAGRAMS_WRITING,
  PipelineStage.DIAGRAMS_WRITTEN,
  PipelineStage.WRITTEN,
  PipelineStage.UNDER_REVIEW,
  PipelineStage.APPROVED,
  PipelineStage.LOCAL_SAVED,
  PipelineStage.REBUILDING,
  PipelineStage.REBUILT,
  PipelineStage.COMPLETED,
] as const;
