/**
 * Executes rebuild stage chains by calling existing runners.
 */

import { handleStageFailure } from "./failure-handler";
import { getJob } from "./import-queue";
import { PipelineStage } from "./pipeline-stage";
import {
  assertModeArtifacts,
  assertRebuildArtifacts,
  hashProductionSchema,
  prepareRunnerStage,
  stagesForMode,
} from "./rebuild-manager";
import type { RebuildMode } from "./rebuild-types";
import { STAGE_TIMEOUT_MS, withStageTimeout } from "./stage-runtime";
import { runSchemaBuildForJob } from "./schema-builder-service";
import { runStructuringForJob } from "./structuring-service";
import { runValidationForJob } from "./validation-service";
import { runWriterForJob } from "./writer-service";
import { readValidationReport } from "./validation-service";

export interface RebuildRunnerResult {
  rebuiltStages: PipelineStage[];
  skippedStages: string[];
  oldSchemaHash: string | null;
  newSchemaHash: string | null;
  validationBlockedWriter: boolean;
}

/**
 * Runs selected post-OCR stages. Never runs OCR / layout / diagram extraction.
 */
export async function runRebuildChain(input: {
  jobId: string;
  mode: RebuildMode;
}): Promise<RebuildRunnerResult> {
  await assertRebuildArtifacts(input.jobId);
  await assertModeArtifacts(input.jobId, input.mode);

  const plan = stagesForMode(input.mode);
  const rebuiltStages: PipelineStage[] = [];
  const oldSchemaHash = await hashProductionSchema(input.jobId);
  let validationBlockedWriter = false;

  try {
    if (plan.runStructuring) {
      await prepareRunnerStage(input.jobId, PipelineStage.DIAGRAMS_READY);
      await withStageTimeout({
        stageId: "structuring",
        timeoutMs: STAGE_TIMEOUT_MS.structuring,
        jobId: input.jobId,
        run: () => runStructuringForJob(input.jobId),
      });
      rebuiltStages.push(PipelineStage.STRUCTURING, PipelineStage.STRUCTURED);
    }

    if (plan.runSchema) {
      await prepareRunnerStage(input.jobId, PipelineStage.STRUCTURED);
      await withStageTimeout({
        stageId: "schema",
        timeoutMs: STAGE_TIMEOUT_MS.schema,
        jobId: input.jobId,
        run: () => runSchemaBuildForJob(input.jobId),
      });
      rebuiltStages.push(
        PipelineStage.SCHEMA_BUILDING,
        PipelineStage.SCHEMA_READY
      );
    }

    if (plan.runValidation) {
      await prepareRunnerStage(input.jobId, PipelineStage.SCHEMA_READY);
      const validation = await withStageTimeout({
        stageId: "validation",
        timeoutMs: STAGE_TIMEOUT_MS.validation,
        jobId: input.jobId,
        run: () => runValidationForJob(input.jobId),
      });
      rebuiltStages.push(PipelineStage.VALIDATING, PipelineStage.VALIDATED);

      if (plan.runWriter && validation.report.status === "FAILED") {
        validationBlockedWriter = true;
        await handleStageFailure({
          jobId: input.jobId,
          stage: PipelineStage.VALIDATING,
          reason:
            "Rebuild validation failed — Writer preview skipped (no partial writes).",
        });
      }
    }

    if (plan.runWriter && !validationBlockedWriter) {
      // Re-check stored validation for writer-only mode.
      if (!plan.runValidation) {
        const stored = await readValidationReport(input.jobId);
        if (stored?.status === "FAILED") {
          throw new Error(
            "Writer cannot rebuild after a failed validation. Rebuild validation first."
          );
        }
      }

      await prepareRunnerStage(input.jobId, PipelineStage.VALIDATED);
      await withStageTimeout({
        stageId: "writer",
        timeoutMs: STAGE_TIMEOUT_MS.writer,
        jobId: input.jobId,
        run: () => runWriterForJob(input.jobId),
      });
      rebuiltStages.push(PipelineStage.WRITING, PipelineStage.WRITTEN);
    }

    const newSchemaHash = await hashProductionSchema(input.jobId);
    const job = await getJob(input.jobId);
    if (!job) {
      throw new Error("Rebuild finished but job could not be reloaded.");
    }

    return {
      rebuiltStages,
      skippedStages: plan.skipped,
      oldSchemaHash,
      newSchemaHash,
      validationBlockedWriter,
    };
  } catch (error) {
    await handleStageFailure({
      jobId: input.jobId,
      stage: PipelineStage.REBUILDING,
      reason: error instanceof Error ? error.message : "Rebuild failed.",
      error,
    });
    throw error;
  }
}
