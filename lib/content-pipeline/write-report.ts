/**
 * Write report types and helpers for the Writer Service.
 */

import type { DiagramWriteStats } from "./diagram-write-report";
import { emptyDiagramWriteStats } from "./diagram-write-report";
import type { ValidationIssue, ValidationReport } from "./schema-types";

export interface WriteReport {
  status: "SUCCESS" | "FAILED";
  writtenAt: string;
  durationMs: number;
  contentDir: string | null;
  filesCreated: string[];
  filesModified: string[];
  papersAdded: number;
  questionsAdded: number;
  subQuestionsAdded: number;
  modulesAdded: number;
  topicsAdded: number;
  attachmentsCopied: number;
  attachmentsSkipped: number;
  diagrams: DiagramWriteStats;
  backupsCreated: string[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  preValidation: ValidationReport | null;
  postValidation: ValidationReport | null;
}

export interface WritingRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "SUCCESS" | "FAILED";
  filesCreated: number;
  filesModified: number;
  papersAdded: number;
  questionsAdded: number;
  topicsAdded: number;
  attachmentsCopied: number;
  diagramsCopied: number;
  diagramsReused: number;
  diagramsSkipped: number;
  errorCount: number;
  warningCount: number;
  reportPath: string;
  manifestPath: string | null;
  contentDir: string | null;
}

export function buildWriteReport(input: {
  status: WriteReport["status"];
  writtenAt: string;
  durationMs: number;
  contentDir: string | null;
  filesCreated: string[];
  filesModified: string[];
  papersAdded: number;
  questionsAdded: number;
  subQuestionsAdded: number;
  modulesAdded: number;
  topicsAdded: number;
  attachmentsCopied: number;
  attachmentsSkipped: number;
  diagrams?: DiagramWriteStats;
  backupsCreated: string[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  preValidation: ValidationReport | null;
  postValidation: ValidationReport | null;
}): WriteReport {
  return {
    status: input.status,
    writtenAt: input.writtenAt,
    durationMs: input.durationMs,
    contentDir: input.contentDir,
    filesCreated: input.filesCreated,
    filesModified: input.filesModified,
    papersAdded: input.papersAdded,
    questionsAdded: input.questionsAdded,
    subQuestionsAdded: input.subQuestionsAdded,
    modulesAdded: input.modulesAdded,
    topicsAdded: input.topicsAdded,
    attachmentsCopied: input.attachmentsCopied,
    attachmentsSkipped: input.attachmentsSkipped,
    diagrams: input.diagrams ?? emptyDiagramWriteStats(),
    backupsCreated: input.backupsCreated,
    warnings: input.warnings,
    errors: input.errors,
    preValidation: input.preValidation,
    postValidation: input.postValidation,
  };
}

export function toWritingRunSummary(
  report: WriteReport,
  startedAt: string,
  reportPath: string
): WritingRunSummary {
  return {
    startedAt,
    completedAt: report.writtenAt,
    durationMs: report.durationMs,
    status: report.status,
    filesCreated: report.filesCreated.length,
    filesModified: report.filesModified.length,
    papersAdded: report.papersAdded,
    questionsAdded: report.questionsAdded,
    topicsAdded: report.topicsAdded,
    attachmentsCopied: report.attachmentsCopied,
    diagramsCopied: report.diagrams.diagramsCopied,
    diagramsReused: report.diagrams.diagramsReused,
    diagramsSkipped: report.diagrams.diagramsSkipped,
    errorCount: report.errors.length,
    warningCount: report.warnings.length,
    reportPath,
    manifestPath: report.diagrams.manifestPath,
    contentDir: report.contentDir,
  };
}
