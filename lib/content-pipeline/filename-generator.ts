/**
 * Deterministic diagram filenames from structural question labels.
 * No UUIDs — Writer phase later appends exam session suffixes.
 */

import { safeTrim } from "./string-normalize";

const QUESTION_LABEL_PATTERN = /(?:q(?:uestion)?\.?\s*|)\s*(\d+)/i;

const SUB_LABEL_PATTERN =
  /(?:\(([a-z])\)|^([a-z])\)|^\(([ivxlcdm]+)\)|^([ivxlcdm]+)\))/i;

/**
 * Extracts a question number label like "Q.1" from structural text.
 */
export function extractQuestionLabel(
  text: string | null | undefined
): string | null {
  const trimmed = safeTrim(text);
  const match = trimmed.match(QUESTION_LABEL_PATTERN);

  if (!match?.[1]) {
    return null;
  }

  return `Q.${match[1]}`;
}

/**
 * Extracts a sub-question letter/roman label like "a" or "i".
 */
export function extractSubQuestionLabel(
  text: string | null | undefined
): string | null {
  const trimmed = safeTrim(text);
  const match = trimmed.match(SUB_LABEL_PATTERN);

  if (!match) {
    return null;
  }

  const label = safeTrim(
    match[1] ?? match[2] ?? match[3] ?? match[4] ?? ""
  ).toLowerCase();

  return label.length > 0 ? label : null;
}

/**
 * Builds a base filename (without extension) from question/sub labels.
 * Falls back to diagram-NNN when no label is available.
 */
export function buildDiagramBasename(input: {
  questionLabel: string | null;
  subQuestionLabel: string | null;
  fallbackIndex: number;
}): string {
  if (input.questionLabel) {
    if (input.subQuestionLabel) {
      return `${input.questionLabel}-${input.subQuestionLabel}`;
    }
    return input.questionLabel;
  }

  return `diagram-${String(input.fallbackIndex).padStart(3, "0")}`;
}

/**
 * Ensures uniqueness within a page folder (Q.1-a, Q.1-a-2, …).
 */
export function allocateUniqueFilename(
  basename: string,
  used: Set<string>
): string {
  let candidate = `${basename}.webp`;
  let suffix = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${basename}-${suffix}.webp`;
    suffix += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}
