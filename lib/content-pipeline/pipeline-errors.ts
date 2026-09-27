/**
 * Actionable CMS pipeline error codes.
 * Messages should include the code, stage, and a recovery hint.
 */

export const CMS_ERROR_CODES = {
  PDF_LOAD_FAILED: "PDF_LOAD_FAILED",
  PDF_RENDER_FAILED: "PDF_RENDER_FAILED",
  PDF_RENDER_EMPTY: "PDF_RENDER_EMPTY",
  PDF_WASM_FAILED: "PDF_WASM_FAILED",
  OCR_FAILED: "OCR_FAILED",
  EMPTY_OCR_TEXT: "EMPTY_OCR_TEXT",
  OCR_ENGINE_FAILED: "OCR_ENGINE_FAILED",
  LAYOUT_FAILED: "LAYOUT_FAILED",
  RECONSTRUCTION_FAILED: "RECONSTRUCTION_FAILED",
  GEMINI_TIMEOUT: "GEMINI_TIMEOUT",
  GEMINI_API_ERROR: "GEMINI_API_ERROR",
  GEMINI_EMPTY_OUTPUT: "GEMINI_EMPTY_OUTPUT",
  GEMINI_MALFORMED_JSON: "GEMINI_MALFORMED_JSON",
  SCHEMA_FAILED: "SCHEMA_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  MERGE_FAILED: "MERGE_FAILED",
  POST_MERGE_VALIDATION_FAILED: "POST_MERGE_VALIDATION_FAILED",
  WRITE_FAILED: "WRITE_FAILED",
  LOCAL_SAVE_FAILED: "LOCAL_SAVE_FAILED",
  GIT_DIFF_FAILED: "GIT_DIFF_FAILED",
  QUEUE_TIMEOUT: "QUEUE_TIMEOUT",
  PIPELINE_TIMEOUT: "PIPELINE_TIMEOUT",
  METADATA_INCOMPLETE: "METADATA_INCOMPLETE",
} as const;

export type CmsErrorCode =
  (typeof CMS_ERROR_CODES)[keyof typeof CMS_ERROR_CODES];

export type CmsRecoverability = "retry" | "fix-input" | "manual";

export class CmsStageError extends Error {
  readonly code: string;
  readonly stage: string;
  readonly recoverability: CmsRecoverability;
  readonly recoveryHint: string;

  constructor(input: {
    code: string;
    stage: string;
    message: string;
    recoverability?: CmsRecoverability;
    recoveryHint: string;
  }) {
    super(`${input.code}: ${input.message} Recovery: ${input.recoveryHint}`);
    this.name = "CmsStageError";
    this.code = input.code;
    this.stage = input.stage;
    this.recoverability = input.recoverability ?? "retry";
    this.recoveryHint = input.recoveryHint;
  }
}

export function errorCodeFromUnknown(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  if (error instanceof Error) {
    const match = error.message.match(/^([A-Z][A-Z0-9_]{2,}):/);
    return match?.[1] ?? null;
  }
  return null;
}
