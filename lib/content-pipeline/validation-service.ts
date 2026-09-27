import fs from "fs/promises";
import path from "path";

import { CMS_VALIDATION_REPORT_FILENAME } from "./constants";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import {
  getProductionPyqsPath,
  getProductionSyllabusPath,
  readProductionPyqs,
  readProductionSyllabus,
} from "./schema-builder-service";
import type { ValidationReport, ValidationRunSummary } from "./schema-types";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { asPipelineError } from "./string-normalize";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord } from "./types";
import { runValidationEngine } from "./validation-engine";

export class ValidationProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ValidationProcessingError";
    this.code = code;
  }
}

export interface RunValidationResult {
  job: ImportJobRecord;
  summary: ValidationRunSummary;
  report: ValidationReport;
}

const validationInFlight = new Set<string>();

export function getValidationReportPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CMS_VALIDATION_REPORT_FILENAME);
}

export async function readValidationReport(
  jobId: string
): Promise<ValidationReport | null> {
  try {
    const raw = await fs.readFile(getValidationReportPath(jobId), "utf8");
    return JSON.parse(raw) as ValidationReport;
  } catch {
    return null;
  }
}

/**
 * Validates production preview JSON artifacts.
 * Advances: SCHEMA_READY → VALIDATING → VALIDATED
 * Does not throw on FAILED validation status — stores report and continues.
 */
export async function runValidationForJob(
  jobId: string
): Promise<RunValidationResult> {
  if (validationInFlight.has(jobId)) {
    throw new ValidationProcessingError(
      "VALIDATION_IN_PROGRESS",
      "Validation is already in progress for this job."
    );
  }

  const metadata = await readJobMetadata(jobId);

  if (!metadata) {
    throw new ValidationProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  const pipeline = await readPipelineState(jobId);
  const currentStage = pipeline?.stage ?? metadata.stage;

  if (
    currentStage !== PipelineStage.SCHEMA_READY &&
    currentStage !== PipelineStage.VALIDATING &&
    currentStage !== PipelineStage.VALIDATED &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new ValidationProcessingError(
      "SCHEMA_REQUIRED",
      "Validation requires SCHEMA_READY first."
    );
  }

  const pyqs = await readProductionPyqs(jobId);
  const syllabus = await readProductionSyllabus(jobId);

  if (!pyqs && !syllabus) {
    throw new ValidationProcessingError(
      "PRODUCTION_JSON_MISSING",
      "production-pyqs.json / production-syllabus.json not found. Run schema builder first."
    );
  }

  const startedAt = new Date().toISOString();
  validationInFlight.add(jobId);

  try {
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.VALIDATING,
      error: null,
    });

    const logStartedAt = await logStageStart({ jobId, stage: "validation" });

    try {
      const jobDir = getJobDirectory(jobId);
      const existingPaths = await collectExistingRelativePaths(jobDir);

      const report = runValidationEngine({
        pyqs,
        syllabus,
        jobDir,
        existingPaths,
        pyqsPath: pyqs ? path.basename(getProductionPyqsPath(jobId)) : null,
        syllabusPath: syllabus
          ? path.basename(getProductionSyllabusPath(jobId))
          : null,
      });

      await fs.writeFile(
        getValidationReportPath(jobId),
        JSON.stringify(report, null, 2) + "\n",
        "utf8"
      );

      const completedAt = new Date().toISOString();
      const summary: ValidationRunSummary = {
        startedAt,
        completedAt,
        durationMs: report.durationMs,
        status: report.status,
        errorCount: report.statistics.errorCount,
        warningCount: report.statistics.warningCount,
        questionCount: report.statistics.questionCount,
        moduleCount: report.statistics.moduleCount,
        topicCount: report.statistics.topicCount,
        diagramCount: report.statistics.diagramCount,
        reportPath: CMS_VALIDATION_REPORT_FILENAME,
      };

      const failureSummary =
        report.status === "FAILED" ? formatValidationFailure(report) : null;

      // Validation FAILED is a report outcome, not a pipeline crash.
      await updateJobStatus(jobId, "queued", {
        stage: PipelineStage.VALIDATED,
        error: failureSummary,
      });

      const latestMetadata = await readJobMetadata(jobId);
      const latestPipeline = await readPipelineState(jobId);

      if (latestMetadata) {
        await updateJobMetadata({
          ...latestMetadata,
          stage: PipelineStage.VALIDATED,
          status: "queued",
          updatedAt: completedAt,
          error: failureSummary,
          validationStatus: report.status === "PASS" ? "passed" : "failed",
        });
      }

      if (latestPipeline) {
        await updatePipelineState({
          ...latestPipeline,
          stage: PipelineStage.VALIDATED,
          status: "queued",
          updatedAt: completedAt,
          error: failureSummary,
          validation: summary,
        });
      }

      const job = await getJob(jobId);

      if (!job) {
        throw new ValidationProcessingError(
          "JOB_HYDRATION_FAILED",
          "Validation finished but the job could not be reloaded."
        );
      }

      await logStageSuccess({
        jobId,
        stage: "validation",
        startedAt: logStartedAt,
        details: {
          status: report.status,
          errorCount: summary.errorCount,
          warningCount: summary.warningCount,
        },
      });

      return {
        job: {
          ...job,
          stage: PipelineStage.VALIDATED,
          status: "queued",
          validation: summary,
        },
        summary,
        report,
      };
    } catch (error) {
      const normalized = asPipelineError(error, "Validation");

      await logStageFailure({
        jobId,
        stage: "validation",
        startedAt: logStartedAt,
        error: normalized,
      });

      const message = normalized.message || "Validation failed.";

      await updateJobStatus(jobId, "failed", {
        stage: PipelineStage.FAILED,
        error: message,
      });

      if (error instanceof ValidationProcessingError) {
        throw error;
      }

      throw new ValidationProcessingError("VALIDATION_FAILED", message);
    }
  } finally {
    validationInFlight.delete(jobId);
  }
}

async function collectExistingRelativePaths(
  jobDir: string
): Promise<Set<string>> {
  const paths = new Set<string>();

  async function walk(currentDir: string, relativePrefix: string) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relative = relativePrefix
        ? `${relativePrefix}/${entry.name}`
        : entry.name;
      const absolute = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        paths.add(relative.replace(/\\/g, "/"));
      }
    }
  }

  await walk(jobDir, "");
  return paths;
}

function formatValidationFailure(report: ValidationReport): string {
  const first = report.errors[0];
  const detail = first
    ? `${first.code}${first.path ? ` at ${first.path}` : ""}: ${first.message}`
    : "unknown error";
  return `VALIDATION_FAILED (${report.statistics.errorCount}): ${detail}`;
}
