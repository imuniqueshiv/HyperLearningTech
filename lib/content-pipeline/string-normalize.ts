/**
 * Safe string normalization for OCR / Gemini / schema / validation data.
 * Never call `.trim()` on a value that may be undefined/null/non-string.
 */

export class PipelineFieldError extends Error {
  readonly code = "PIPELINE_FIELD_ERROR";
  readonly stage: string;
  readonly field: string;
  readonly question: string | null;
  readonly expected: string;
  readonly received: string;

  constructor(input: {
    stage: string;
    field: string;
    question?: string | null;
    expected?: string;
    received: unknown;
    message?: string;
  }) {
    const receivedLabel = describeReceived(input.received);
    const expected = input.expected ?? "string";
    const question = safeTrim(input.question, "") || null;
    const lines = [
      `${input.stage} Failed`,
      `Field: ${input.field}`,
      ...(question ? [`Question: ${question}`] : []),
      `Expected: ${expected}`,
      `Received: ${receivedLabel}`,
    ];
    super(input.message ?? lines.join("\n"));
    this.name = "PipelineFieldError";
    this.stage = input.stage;
    this.field = input.field;
    this.question = question;
    this.expected = expected;
    this.received = receivedLabel;
  }
}

export function describeReceived(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") {
    return value.length === 0 ? '"" (empty string)' : JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return `array(length=${value.length})`;
  if (typeof value === "object") return "object";
  return typeof value;
}

/**
 * Coerce unknown → trimmed string. Never throws.
 * undefined/null/non-string → fallback (default "").
 */
export function safeTrim(value: unknown, fallback: string = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

/**
 * Like safeTrim but returns null when empty after trim / non-string.
 */
export function safeTrimOrNull(value: unknown): string | null {
  const trimmed = safeTrim(value, "");
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Require a non-empty string; throws PipelineFieldError with actionable detail.
 */
export function requireNonEmptyString(
  value: unknown,
  context: {
    stage: string;
    field: string;
    question?: string | null;
    fallback?: string;
  }
): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    if (context.fallback != null) {
      return context.fallback;
    }
    throw new PipelineFieldError({
      stage: context.stage,
      field: context.field,
      question: context.question,
      expected: "non-empty string",
      received: value,
    });
  }

  if (context.fallback != null) {
    return context.fallback;
  }

  throw new PipelineFieldError({
    stage: context.stage,
    field: context.field,
    question: context.question,
    expected: "string",
    received: value,
  });
}

/**
 * Canonical optional-string normalization. Never throws.
 */
export function normalizeOptionalString(
  value: unknown,
  fallback: string = ""
): string {
  return safeTrim(value, fallback);
}

/**
 * Canonical required-string normalization for merge identity fields.
 * Throws MERGE_METADATA_INVALID instead of TypeError.trim.
 */
export function normalizeRequiredString(
  value: unknown,
  fieldPath: string,
  recoveryHint: string
): string {
  const trimmed = safeTrim(value);
  if (trimmed.length > 0) {
    return trimmed;
  }
  throw new MergeMetadataError({
    field: fieldPath,
    received: value,
    message: `${fieldPath} is required for merge identity.`,
    recoveryHint,
  });
}

/**
 * Merge policy for optional-or-present strings:
 * keep existing when it is a non-empty string; otherwise use incoming
 * when it is a non-empty string; otherwise fallback.
 * Never calls `.trim()` on a non-string.
 */
export function preferNonEmptyString(
  existing: unknown,
  incoming: unknown,
  fallback: string = ""
): string {
  const left = safeTrim(existing);
  if (left.length > 0) {
    return left;
  }
  const right = safeTrim(incoming);
  if (right.length > 0) {
    return right;
  }
  return fallback;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export class MergeMetadataError extends Error {
  readonly code = "MERGE_METADATA_INVALID";
  readonly stage = "MERGE";
  readonly field: string;
  readonly recoverability = "fix-input" as const;
  readonly recoveryHint: string;

  constructor(input: {
    field: string;
    received: unknown;
    message: string;
    recoveryHint: string;
  }) {
    super(
      `MERGE_METADATA_INVALID: Field: ${input.field} Value: ${describeReceived(input.received)} Stage: MERGE ${input.message} Recovery: ${input.recoveryHint}`
    );
    this.name = "MergeMetadataError";
    this.field = input.field;
    this.recoveryHint = input.recoveryHint;
  }
}

export function firstNonEmpty(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const trimmed = safeTrim(candidate, "");
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}

/**
 * Convert native TypeError.trim crashes into actionable PipelineFieldError when possible.
 * Returns the original error (or Error wrapper) when it is not a trim crash.
 */
export function asPipelineError(error: unknown, fallbackStage: string): Error {
  if (error instanceof PipelineFieldError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  if (
    /reading ['"]trim['"]/i.test(message) ||
    /\.trim is not a function/i.test(message)
  ) {
    return new PipelineFieldError({
      stage: fallbackStage,
      field: "unknown",
      expected: "string",
      received: undefined,
      message: [
        `${fallbackStage} Failed`,
        "A required text field was missing (undefined/null) before string normalization.",
        `Original: ${message}`,
      ].join("\n"),
    });
  }

  return error instanceof Error ? error : new Error(message);
}

/**
 * Wrap native TypeError.trim crashes into actionable PipelineFieldError when possible.
 */
export function rethrowAsPipelineFieldError(
  error: unknown,
  fallbackStage: string
): never {
  throw asPipelineError(error, fallbackStage);
}
