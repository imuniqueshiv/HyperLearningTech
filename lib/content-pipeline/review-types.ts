/**
 * Review Center types.
 */

import type { ValidationReport } from "./schema-types";
import type { WriteReport } from "./write-report";
import type { DiagramManifest } from "./diagram-manifest";

export type ReviewDecision = "approve" | "reject" | "request_changes";

export type DiffChangeKind = "added" | "removed" | "modified" | "unchanged";

export interface JsonDiffEntry {
  path: string;
  kind: DiffChangeKind;
  before?: unknown;
  after?: unknown;
  summary: string;
}

export interface JsonDiffResult {
  label: string;
  entries: JsonDiffEntry[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

export interface ReviewSummary {
  jobId: string;
  decision: ReviewDecision | null;
  decidedAt: string | null;
  note: string | null;
  editedPyqs: boolean;
  editedSyllabus: boolean;
  papersAdded: number;
  questionsAdded: number;
  modulesAdded: number;
  topicsAdded: number;
  diagramPlans: number;
}

export interface ReviewRunSummary {
  startedAt: string;
  completedAt: string | null;
  decision: ReviewDecision | null;
  note: string | null;
  pyqsDiffCount: number;
  syllabusDiffCount: number;
}

export interface ReviewPackage {
  jobId: string;
  stage: string;
  status: string;
  /** Job type at import time (pyq | syllabus | …). */
  jobType?: string | null;
  contentDir: string | null;
  /** Authoritative on-disk subject content (read-only for this review). */
  existingPyqs: unknown | null;
  existingSyllabus: unknown | null;
  /**
   * Merged save candidate (existing + extracted). May contain many papers.
   * Not the isolated extracted-paper preview.
   */
  pendingPyqs: unknown | null;
  pendingSyllabus: unknown | null;
  /** Alias of extracted one-paper preview (production-pyqs.json). */
  productionPyqs: unknown | null;
  productionSyllabus: unknown | null;
  /**
   * Isolated extracted-paper preview — exactly one paper when extraction
   * succeeded. Prefer this over pendingPyqs for "what was imported".
   */
  extractedPyqs?: unknown | null;
  /** Merged save candidate (same as pendingPyqs when present). */
  mergedSaveCandidate?: unknown | null;
  /** True when this import must not modify syllabus.json. */
  pyqOnlyImport?: boolean;
  /** Save/approve readiness beyond schema PASS. */
  extractionQuality?:
    | import("./extraction-quality").ExtractionQualityAssessment
    | null;
  validationReport: ValidationReport | null;
  writeReport: WriteReport | null;
  diagramManifest: DiagramManifest | null;
  saveReport: SaveReport | null;
  pyqsDiff: JsonDiffResult;
  syllabusDiff: JsonDiffResult;
  review: ReviewSummary | null;
  extractedMetadata?:
    | import("./metadata-extractor").ExtractedImportMetadata
    | null;
  branch?: string | null;
  semester?: string | null;
  subjectCode?: string | null;
  year?: number | null;
  examSession?: string | null;
  /** Phase 2 extraction evidence summary for reviewers. */
  extractionEvidence?: {
    status: string | null;
    paperCount: number;
    questionCount: number;
    pageCount: number;
    warnings: string[];
    errors: string[];
    papers: Array<{
      paperId: string;
      paperIndex: number;
      sourcePages: number[];
      confidence: number;
      questionCount: number;
      reviewRequired: boolean;
      subjectCode?: string | null;
      warnings: string[];
    }>;
    questions: Array<{
      id: string;
      paperId: string;
      questionNumber: number | string | null;
      sourcePages: number[];
      confidence: number;
      hasDiagram: boolean;
      validationStatus?: string | null;
      warnings: string[];
      textPreview: string;
    }>;
  } | null;
  /** Phase 3: duplicate paper classification vs existing content. */
  duplicateDetection?:
    | import("./duplicate-paper-detector").DuplicatePaperReport
    | null;
  /** Phase 3: categorized warning buckets. */
  warningSummary?: import("./warning-catalog").WarningSummary | null;
  /** Phase 3: objective quality indicators (not an AI score). */
  qualityIndicators?:
    | import("./content-quality-indicators").ContentQualityIndicators
    | null;
  /** Phase 3: import timing / observability snapshot. */
  diagnostics?: import("./import-diagnostics").ImportDiagnostics | null;
  /** Phase 3 hardening: RGPV question-paper eligibility. */
  documentEligibility?:
    | import("./document-eligibility").DocumentEligibilityResult
    | null;
}

export interface SaveReport {
  status: "SUCCESS" | "FAILED";
  savedAt: string;
  durationMs: number;
  contentDir: string | null;
  filesUpdated: string[];
  filesCreated: string[];
  diagramsCopied: number;
  diagramsReused: number;
  diagramsSkipped: number;
  writeReportPath: string | null;
  errors: string[];
  warnings: string[];
}

export interface SaveRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED";
  filesCreated: number;
  filesUpdated: number;
  diagramsCopied: number;
  reportPath: string;
  contentDir: string | null;
}

export interface GitFileChange {
  path: string;
  status: string;
  kind: "modified" | "untracked" | "deleted" | "other";
}

export interface GitReviewSnapshot {
  branch: string | null;
  statusText: string;
  diffText: string;
  modifiedFiles: GitFileChange[];
  untrackedFiles: GitFileChange[];
  deletedFiles: GitFileChange[];
  changedJsonFiles: string[];
  changedDiagramFiles: string[];
  nextCommands: string[];
  capturedAt: string;
}
