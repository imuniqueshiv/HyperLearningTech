/**
 * Extraction / save readiness gates for Review Center.
 * Schema PASS alone is never sufficient for approval.
 */

import type { ProductionPyqsJson } from "./schema-types";
import { analyzeQuestionNumberSequence } from "./question-number";
import { summarizeWarnings, type WarningSummary } from "./warning-catalog";

// analyzeQuestionNumberSequence used for gaps + duplicates below.

export type ExtractionReadiness = "READY" | "NEEDS_REVIEW" | "BLOCKED";

export interface ExtractionQualityAssessment {
  readiness: ExtractionReadiness;
  canApprove: boolean;
  canSave: boolean;
  codes: string[];
  reasons: string[];
  gapCount: number;
  questionCount: number;
  paperCount: number;
  declaredQuestionTotal: number | null;
  suspiciousTextCount: number;
  emptyQuestionCount: number;
}

/** Chrome / layout bleed — not paper-specific wording. */
const SUSPICIOUS_OCR =
  /(?:Enrolment No\.|https?:\/\/www\.rgpvonline\.com|Total No\.?\s*of\s*(?:Questions|Printed Pages)|Grading System\s*\(\s*GS\s*\)|B\.Tech\.\s+IV Semester)/i;

/** Two distinct question openers packed into one reconstructed field. */
const PACKED_QUESTION_OPENERS =
  /(?:^|[\s\n])(?:q\.?\s*)?\d{1,2}\s*[.)]\s*\([a-z]\)[\s\S]{0,120}(?:^|[\s\n])(?:q\.?\s*)?\d{1,2}\s*[.)]\s*\([a-z]\)/i;

const DECLARED_TOTAL = /Total\s*No\.?\s*of\s*Questions\s*[:.]?\s*(\d{1,2})/i;

/**
 * Parse "Total No. of Questions : N" from free-form OCR / evidence text.
 */
export function parseDeclaredQuestionTotal(
  texts: Array<string | null | undefined>
): number | null {
  for (const text of texts) {
    if (!text) continue;
    const match = DECLARED_TOTAL.exec(text);
    if (!match) continue;
    const n = Number.parseInt(match[1] ?? "", 10);
    if (Number.isFinite(n) && n >= 1 && n <= 40) return n;
  }
  return null;
}

function collectQuestionTexts(pyqs: ProductionPyqsJson | null): string[] {
  if (!pyqs?.papers?.length) return [];
  const out: string[] = [];
  for (const paper of pyqs.papers) {
    for (const q of paper.questions ?? []) {
      const subText = (q.subQuestions ?? [])
        .map((s) => s.text ?? "")
        .join("\n");
      // Production questions store body text on subQuestions only.
      out.push(subText);
    }
  }
  return out;
}

function isSuspiciousQuestionText(text: string): boolean {
  if (!text.trim()) return false;
  return SUSPICIOUS_OCR.test(text) || PACKED_QUESTION_OPENERS.test(text);
}

function questionIndicesFromPyqs(pyqs: ProductionPyqsJson | null): number[] {
  if (!pyqs?.papers?.length) return [];
  const indices: number[] = [];
  for (const paper of pyqs.papers) {
    for (const q of paper.questions ?? []) {
      const raw = q.questionNumber ?? q.id ?? "";
      const match = /(?:Q\.?\s*)?(\d{1,2})/i.exec(String(raw));
      if (match) {
        const n = Number.parseInt(match[1] ?? "", 10);
        if (Number.isFinite(n)) indices.push(n);
      }
    }
  }
  return indices;
}

/**
 * Assess whether an extracted one-paper PYQ is safe to approve/save.
 * Uses production (extracted) JSON + warning summary + optional OCR snippets.
 *
 * READY — schema-valid, no material quality issues
 * NEEDS_REVIEW — schema-valid but humans should inspect (soft gaps, topic warnings)
 * BLOCKED — critical extraction quality failures; approve/save must fail
 */
export function assessExtractionQuality(input: {
  extractedPyqs: ProductionPyqsJson | null;
  warningSummary?: WarningSummary | null;
  validationStatus?: "PASS" | "FAILED" | null;
  evidenceStatus?: string | null;
  ocrTexts?: Array<string | null | undefined>;
  /** 0–100 average OCR confidence when known; low scores force NEEDS_REVIEW. */
  ocrConfidencePercent?: number | null;
}): ExtractionQualityAssessment {
  const codes: string[] = [];
  const reasons: string[] = [];
  const extracted = input.extractedPyqs;
  const paperCount = extracted?.papers?.length ?? 0;
  const questionCount =
    extracted?.papers?.reduce(
      (sum, p) => sum + (p.questions?.length ?? 0),
      0
    ) ?? 0;

  const indices = questionIndicesFromPyqs(extracted);
  const { gaps } = analyzeQuestionNumberSequence(indices);
  const gapCount = gaps.length;

  const texts = collectQuestionTexts(extracted);
  const emptyQuestionCount = texts.filter((t) => !t.trim()).length;
  const suspiciousTextCount = texts.filter((t) =>
    isSuspiciousQuestionText(t)
  ).length;

  const declaredQuestionTotal = parseDeclaredQuestionTotal([
    ...(input.ocrTexts ?? []),
    ...texts,
  ]);

  const warningSummary = input.warningSummary ?? summarizeWarnings([]);
  const { duplicates } = analyzeQuestionNumberSequence(indices);

  if (input.validationStatus === "FAILED") {
    codes.push("SCHEMA_INVALID");
    reasons.push("Schema validation FAILED.");
  }
  if (input.evidenceStatus === "INVALID" || input.evidenceStatus === "FAILED") {
    codes.push("EVIDENCE_INVALID");
    reasons.push("Extraction evidence is INVALID.");
  }
  if (paperCount !== 1) {
    codes.push("ONE_PAPER_REQUIRED");
    reasons.push(
      `Extracted preview must contain exactly one paper (got ${paperCount}).`
    );
  }
  if (questionCount === 0) {
    codes.push("NO_QUESTIONS_EXTRACTED");
    reasons.push("No questions were extracted from the import.");
  }
  if (gapCount >= 2) {
    codes.push("QUESTION_NUMBER_GAP");
    reasons.push(
      `Severe question-number gaps (${gaps.map((g) => `Q.${g}`).join(", ")}).`
    );
  }
  if (
    declaredQuestionTotal != null &&
    questionCount > 0 &&
    questionCount < declaredQuestionTotal &&
    declaredQuestionTotal - questionCount >= 2
  ) {
    codes.push("QUESTION_COUNT_BELOW_DECLARED");
    reasons.push(
      `Paper declares ${declaredQuestionTotal} questions but only ${questionCount} were extracted.`
    );
  }
  if (declaredQuestionTotal != null && questionCount > declaredQuestionTotal) {
    codes.push("QUESTION_COUNT_ABOVE_DECLARED");
    reasons.push(
      `Paper declares ${declaredQuestionTotal} questions but extraction produced ${questionCount} top-level questions (likely mis-grouping / column bleed).`
    );
  }
  if (duplicates.length > 0) {
    codes.push("DUPLICATE_QUESTION_NUMBER");
    reasons.push(
      `Duplicate question numbers in extraction: ${duplicates.map((d) => `Q.${d}`).join(", ")}.`
    );
  }
  if (emptyQuestionCount > 0) {
    codes.push("EMPTY_QUESTION_TEXT");
    reasons.push(
      `${emptyQuestionCount} question(s) have empty reconstructed text.`
    );
  }
  const structureSound =
    paperCount === 1 &&
    questionCount > 0 &&
    gapCount === 0 &&
    duplicates.length === 0 &&
    emptyQuestionCount === 0 &&
    (declaredQuestionTotal == null || questionCount === declaredQuestionTotal);
  let ocrNeedsReview = false;
  if (suspiciousTextCount > 0) {
    if (structureSound) {
      // Structure matches the paper; OCR chrome/bleed still needs human review.
      ocrNeedsReview = true;
      reasons.push(
        `${suspiciousTextCount} question(s) show OCR chrome / column bleed — review before save.`
      );
    } else {
      codes.push("OCR_CORRUPTION_SUSPECTED");
      reasons.push(
        `${suspiciousTextCount} question(s) show OCR corruption / column bleed.`
      );
    }
  }
  const ocrConfidence = input.ocrConfidencePercent;
  if (
    typeof ocrConfidence === "number" &&
    Number.isFinite(ocrConfidence) &&
    ocrConfidence < 70
  ) {
    ocrNeedsReview = true;
    reasons.push(
      `Average OCR confidence is ${Math.round(ocrConfidence)}% — review reconstructed wording before save.`
    );
  }
  if (warningSummary.counts.critical > 0) {
    codes.push("CRITICAL_WARNINGS");
    reasons.push(
      `${warningSummary.counts.critical} critical warning(s) remain.`
    );
  }

  const isBlocked = codes.length > 0;
  const needsReview =
    !isBlocked &&
    (ocrNeedsReview ||
      warningSummary.counts.reviewRequired > 0 ||
      gapCount > 0);

  const readiness: ExtractionReadiness = isBlocked
    ? "BLOCKED"
    : needsReview
      ? "NEEDS_REVIEW"
      : "READY";

  // Reviewers may open NEEDS_REVIEW packages; save requires READY.
  const canApprove = readiness !== "BLOCKED";
  const canSave = readiness === "READY";

  return {
    readiness,
    canApprove,
    canSave,
    codes: [...new Set(codes)],
    reasons,
    gapCount,
    questionCount,
    paperCount,
    declaredQuestionTotal,
    suspiciousTextCount,
    emptyQuestionCount,
  };
}
