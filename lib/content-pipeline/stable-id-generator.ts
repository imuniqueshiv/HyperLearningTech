/**
 * Deterministic ID helpers for production preview JSON.
 * Same inputs always produce the same IDs — no UUIDs / randomness.
 */

import { safeTrim } from "./string-normalize";

export function normalizeSubjectCode(code: string | null | undefined): string {
  const raw = safeTrim(code, "unknown");
  if (!raw) {
    return "unknown";
  }
  return raw.toUpperCase().replace(/\s+/g, "-");
}

/** e.g. BT-104 → bt-104 (subject.id) */
export function toSubjectId(code: string | null | undefined): string {
  return normalizeSubjectCode(code).toLowerCase();
}

/** e.g. BT-104 → bt104 (compact prefix for module/topic ids) */
export function toSubjectKey(code: string | null | undefined): string {
  return normalizeSubjectCode(code)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function slugify(value: string | null | undefined): string {
  return safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function extractQuestionIndex(
  questionNumber: string | null | undefined,
  fallback: number
): number {
  const match = safeTrim(questionNumber).match(/(\d+)/);
  if (!match) {
    return fallback;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function extractSubQuestionLetter(
  label: string | null | undefined,
  fallbackIndex: number
): string {
  const cleaned = safeTrim(label)
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
  if (cleaned) {
    return cleaned;
  }
  return String.fromCharCode(97 + Math.max(0, fallbackIndex));
}

export function buildQuestionId(questionIndex: number): string {
  return `q${questionIndex}`;
}

export function buildSubQuestionId(
  questionIndex: number,
  letter: string
): string {
  return `q${questionIndex}${letter}`;
}

export function buildAttachmentId(
  subQuestionId: string,
  attachmentIndex: number
): string {
  return `${subQuestionId}-img-${attachmentIndex}`;
}

export function buildModuleId(subjectKey: string, unitNumber: number): string {
  return `${subjectKey}-u${unitNumber}`;
}

export function buildTopicId(
  moduleId: string,
  slug: string,
  displayOrder: number
): string {
  const safeSlug = slugify(slug) || `topic-${displayOrder}`;
  return `${moduleId}-${safeSlug}`;
}

export function buildCanonicalQuestionLinkId(input: {
  subjectKey: string;
  unitNumber: number;
  month: string | null;
  year: number | null;
  questionIndex: number;
  isPredicted: boolean;
}): string {
  if (input.isPredicted) {
    return `${input.subjectKey}_m${input.unitNumber}_predicted_q${input.questionIndex}`;
  }

  const month = (input.month ?? "unknown").toLowerCase().replace(/[^a-z]/g, "");
  const year = input.year ?? 0;
  return `${input.subjectKey}_m${input.unitNumber}_${month}${year}_q${input.questionIndex}`;
}

export function monthYearSessionFolder(
  month: string | null,
  year: number | null
): string {
  const m = (month ?? "unknown").toLowerCase().replace(/[^a-z]/g, "");
  const y = year ?? 0;
  return `${m}-${y}`;
}
