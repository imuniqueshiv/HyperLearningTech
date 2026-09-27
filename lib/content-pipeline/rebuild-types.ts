/**
 * Rebuild pipeline types (Phase 19).
 */

import type { ValidationReport } from "./schema-types";
import type { PipelineStage } from "./pipeline-stage";

/** Which segment of the post-OCR pipeline to regenerate. */
export type RebuildMode =
  | "full"
  | "structuring"
  | "schema"
  | "validation"
  | "writer";

export interface RebuildReport {
  jobId: string;
  mode: RebuildMode;
  status: "SUCCESS" | "FAILED";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  rebuiltStages: PipelineStage[];
  skippedStages: string[];
  promptVersion: string;
  validationVersion: string;
  oldValidation: {
    status: string;
    errorCount: number;
    warningCount: number;
  } | null;
  newValidation: {
    status: string;
    errorCount: number;
    warningCount: number;
  } | null;
  oldSchemaHash: string | null;
  newSchemaHash: string | null;
  error: string | null;
}

export interface RebuildRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED";
  mode: RebuildMode;
  rebuiltStages: PipelineStage[];
  promptVersion: string;
  validationVersion: string;
  oldSchemaHash: string | null;
  newSchemaHash: string | null;
  reportPath: string;
}

export interface RebuildResult {
  job: import("./types").ImportJobRecord;
  summary: RebuildRunSummary;
  report: RebuildReport;
}

export function summarizeValidation(
  report: ValidationReport | null
): RebuildReport["oldValidation"] {
  if (!report) {
    return null;
  }
  return {
    status: report.status,
    errorCount: report.statistics.errorCount,
    warningCount: report.statistics.warningCount,
  };
}
