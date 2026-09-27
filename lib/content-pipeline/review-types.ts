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
  contentDir: string | null;
  existingPyqs: unknown | null;
  existingSyllabus: unknown | null;
  pendingPyqs: unknown | null;
  pendingSyllabus: unknown | null;
  productionPyqs: unknown | null;
  productionSyllabus: unknown | null;
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
