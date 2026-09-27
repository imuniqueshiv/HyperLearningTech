/**
 * Client-only helper: runs the full ingestion pipeline via existing CMS APIs.
 * Does not change backend services.
 */

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { ImportJobRecord } from "@/lib/content-pipeline";

export type PipelineUiStageId =
  | "ocr"
  | "layout"
  | "diagrams"
  | "structuring"
  | "schema"
  | "validation"
  | "writer";

export type PipelineUiStageState = "waiting" | "running" | "done" | "failed";

export const PIPELINE_UI_STAGES: {
  id: PipelineUiStageId;
  label: string;
  endpoint: string;
}[] = [
  { id: "ocr", label: "OCR", endpoint: API_ENDPOINTS.CMS_OCR },
  { id: "layout", label: "Layout", endpoint: API_ENDPOINTS.CMS_LAYOUT },
  { id: "diagrams", label: "Diagrams", endpoint: API_ENDPOINTS.CMS_DIAGRAMS },
  {
    id: "structuring",
    label: "Structuring",
    endpoint: API_ENDPOINTS.CMS_STRUCTURING,
  },
  { id: "schema", label: "Schema", endpoint: API_ENDPOINTS.CMS_SCHEMA },
  {
    id: "validation",
    label: "Validation",
    endpoint: API_ENDPOINTS.CMS_VALIDATION,
  },
  { id: "writer", label: "Writer", endpoint: API_ENDPOINTS.CMS_WRITE },
];

export function createInitialPipelineProgress(): Record<
  PipelineUiStageId,
  PipelineUiStageState
> {
  return {
    ocr: "waiting",
    layout: "waiting",
    diagrams: "waiting",
    structuring: "waiting",
    schema: "waiting",
    validation: "waiting",
    writer: "waiting",
  };
}

export interface RunPipelineResult {
  job: ImportJobRecord;
  failedStage: PipelineUiStageId | null;
  error: string | null;
}

/**
 * Sequentially calls existing stage APIs. Stops on first failure.
 * Skips Writer when validation report status is FAILED.
 */
export async function runFullPipeline(input: {
  jobId: string;
  onProgress?: (
    stageId: PipelineUiStageId,
    state: PipelineUiStageState,
    job?: ImportJobRecord
  ) => void;
}): Promise<RunPipelineResult> {
  let latestJob: ImportJobRecord | null = null;

  for (const stage of PIPELINE_UI_STAGES) {
    input.onProgress?.(stage.id, "running", latestJob ?? undefined);

    const response = await fetch(stage.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: input.jobId }),
    });

    const data = (await response.json()) as {
      success: boolean;
      error?: string;
      job?: ImportJobRecord;
      report?: { status?: string };
    };

    if (!response.ok || !data.success || !data.job) {
      input.onProgress?.(stage.id, "failed", data.job);
      return {
        job: data.job ?? ({ id: input.jobId } as ImportJobRecord),
        failedStage: stage.id,
        error: data.error ?? `${stage.label} failed.`,
      };
    }

    latestJob = data.job;
    input.onProgress?.(stage.id, "done", latestJob);

    if (stage.id === "validation" && data.report?.status === "FAILED") {
      return {
        job: latestJob,
        failedStage: "validation",
        error:
          "Validation failed. Pipeline stopped before Writer. Fix content or rebuild, then retry.",
      };
    }
  }

  return {
    job: latestJob!,
    failedStage: null,
    error: null,
  };
}
