/**
 * Rebuild report helpers.
 */

import path from "path";

import { CMS_REBUILD_REPORT_FILENAME } from "./constants";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";
import type { RebuildReport, RebuildRunSummary } from "./rebuild-types";
import { getJobDirectory } from "./temp-storage";

export function getRebuildReportPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_REBUILD_REPORT_FILENAME);
}

export async function writeRebuildReport(
  report: RebuildReport
): Promise<string> {
  const reportPath = getRebuildReportPath(report.jobId);
  await writeJsonAtomic(reportPath, report);
  return reportPath;
}

export async function readRebuildReport(
  jobId: string
): Promise<RebuildReport | null> {
  return readJsonFile<RebuildReport>(getRebuildReportPath(jobId));
}

export function toRebuildRunSummary(report: RebuildReport): RebuildRunSummary {
  return {
    startedAt: report.startedAt,
    completedAt: report.completedAt,
    durationMs: report.durationMs,
    status: report.status,
    mode: report.mode,
    rebuiltStages: report.rebuiltStages,
    promptVersion: report.promptVersion,
    validationVersion: report.validationVersion,
    oldSchemaHash: report.oldSchemaHash,
    newSchemaHash: report.newSchemaHash,
    reportPath: CMS_REBUILD_REPORT_FILENAME,
  };
}
