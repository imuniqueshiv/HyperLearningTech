/**
 * Maps internal job stage/status → Import Session UI status + progress labels.
 */

import { PipelineStage } from "./pipeline-stage";
import type { ImportJobRecord, ImportSessionStatus } from "./types";

/** Friendly pipeline steps shown in the session UI (not action buttons). */
export const IMPORT_SESSION_STEPS = [
  { id: "ocr", label: "OCR" },
  { id: "layout", label: "Layout" },
  { id: "reconstruction", label: "Reconstruction" },
  { id: "gemini", label: "Gemini" },
  { id: "schema", label: "Schema" },
  { id: "validation", label: "Validation" },
  { id: "merge", label: "Merge" },
  { id: "writer", label: "Write" },
] as const;

export type ImportSessionStepId = (typeof IMPORT_SESSION_STEPS)[number]["id"];

export type SessionStepState = "pending" | "running" | "done" | "failed";

/**
 * Derives the five UI statuses from job state.
 */
export function getImportSessionStatus(
  job: ImportJobRecord
): ImportSessionStatus {
  if (
    job.status === "failed" ||
    job.stage === PipelineStage.FAILED ||
    job.stage === PipelineStage.TIMEOUT ||
    job.stage === PipelineStage.CANCELLED
  ) {
    return "Failed";
  }

  if (
    job.validationStatus === "failed" &&
    (job.stage === PipelineStage.VALIDATED ||
      job.stage === PipelineStage.QUEUED)
  ) {
    return "Failed";
  }

  if (job.error && job.stage === PipelineStage.VALIDATED) {
    return "Failed";
  }

  if (
    job.stage === PipelineStage.LOCAL_SAVED ||
    job.stage === PipelineStage.COMPLETED ||
    job.status === "completed"
  ) {
    return "Completed";
  }

  if (job.stage === PipelineStage.APPROVED) {
    return "Completed";
  }

  if (
    job.stage === PipelineStage.WRITTEN ||
    job.stage === PipelineStage.REBUILT ||
    job.stage === PipelineStage.UNDER_REVIEW ||
    job.status === "awaiting_review"
  ) {
    return "Review Ready";
  }

  if (
    job.stage === PipelineStage.QUEUED ||
    job.stage === PipelineStage.UPLOADED
  ) {
    return "Queued";
  }

  return "Running";
}

/**
 * Maps current pipeline stage onto friendly step progress.
 */
export function getSessionStepStates(
  job: ImportJobRecord
): Record<ImportSessionStepId, SessionStepState> {
  const status = getImportSessionStatus(job);
  const failed = status === "Failed";

  const states: Record<ImportSessionStepId, SessionStepState> = {
    ocr: "pending",
    layout: "pending",
    reconstruction: "pending",
    gemini: "pending",
    schema: "pending",
    validation: "pending",
    merge: "pending",
    writer: "pending",
  };

  const markDoneThrough = (lastDone: ImportSessionStepId) => {
    const order: ImportSessionStepId[] = [
      "ocr",
      "layout",
      "reconstruction",
      "gemini",
      "schema",
      "validation",
      "merge",
      "writer",
    ];
    const idx = order.indexOf(lastDone);
    for (let i = 0; i <= idx; i += 1) {
      states[order[i]] = "done";
    }
  };

  if (job.ocr) markDoneThrough("ocr");
  if (job.layout) {
    markDoneThrough("layout");
    states.reconstruction = "done";
  }
  if (job.diagrams) {
    states.reconstruction = "done";
  }
  if (job.structuring) markDoneThrough("gemini");
  if (job.schema) markDoneThrough("schema");

  const validationFailed =
    job.validationStatus === "failed" ||
    job.validation?.status === "FAILED" ||
    (Boolean(job.validation) &&
      typeof job.error === "string" &&
      /validation failed/i.test(job.error));

  if (job.validation && !validationFailed) {
    markDoneThrough("validation");
  } else if (job.schema && validationFailed) {
    // Schema succeeded; validation ran and failed — do not paint Merge ✗.
    markDoneThrough("schema");
    states.validation = "failed";
  } else if (job.validation) {
    markDoneThrough("schema");
    states.validation = "failed";
  }

  if (job.writing) {
    markDoneThrough("merge");
    states.writer = "done";
  }

  if (status === "Review Ready" || status === "Completed") {
    markDoneThrough("writer");
  }

  if (failed) {
    if (validationFailed && states.validation !== "failed") {
      states.validation = "failed";
    } else if (!validationFailed) {
      const current = inferRunningStep(job);
      if (current) {
        states[current] = "failed";
      }
    }
  } else if (status === "Running") {
    const current = inferRunningStep(job);
    if (current) {
      states[current] = "running";
    }
  }

  return states;
}

function inferRunningStep(job: ImportJobRecord): ImportSessionStepId | null {
  switch (job.stage) {
    case PipelineStage.OCR_PROCESSING:
      return "ocr";
    case PipelineStage.LAYOUT_PROCESSING:
      return "layout";
    case PipelineStage.DIAGRAM_EXTRACTION:
      return "reconstruction";
    case PipelineStage.STRUCTURING:
      return "gemini";
    case PipelineStage.SCHEMA_BUILDING:
      return "schema";
    case PipelineStage.VALIDATING:
      return "validation";
    case PipelineStage.WRITING:
    case PipelineStage.DIAGRAMS_WRITING:
      return job.writing ? "writer" : "merge";
    default:
      if (!job.ocr) return "ocr";
      if (!job.layout) return "layout";
      if (!job.diagrams) return "reconstruction";
      if (!job.structuring) return "gemini";
      if (!job.schema) return "schema";
      if (!job.validation) return "validation";
      if (!job.writing) return "merge";
      return null;
  }
}

/**
 * Human-readable current step line for Running sessions.
 */
export function getSessionProgressLabel(job: ImportJobRecord): string {
  const status = getImportSessionStatus(job);
  if (status === "Queued") return "Queued";
  if (status === "Review Ready") return "Ready for review";
  if (status === "Completed") return "Completed";
  if (status === "Failed") {
    if (job.stage === PipelineStage.TIMEOUT) {
      return job.error ? `Timed out: ${job.error}` : "Timed out";
    }
    if (job.stage === PipelineStage.CANCELLED) {
      return job.error ? `Cancelled: ${job.error}` : "Cancelled";
    }
    return job.error ? `Failed: ${job.error}` : "Failed";
  }

  const states = getSessionStepStates(job);
  const running = IMPORT_SESSION_STEPS.find(
    (step) => states[step.id] === "running"
  );
  if (running) {
    return `Running ${running.label}…`;
  }

  const pending = IMPORT_SESSION_STEPS.find(
    (step) => states[step.id] === "pending"
  );
  if (pending) {
    return `${pending.label} pending…`;
  }

  return "Processing…";
}

export function sessionStatusTone(status: ImportSessionStatus): string {
  switch (status) {
    case "Queued":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "Running":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400";
    case "Review Ready":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
    case "Completed":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "Failed":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
  }
}
