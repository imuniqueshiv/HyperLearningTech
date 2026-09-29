/**
 * Phase 2: Cross-page question continuation.
 * Merges question candidates that continue across page boundaries.
 */

import type { QuestionCandidateEvidence } from "./extraction-evidence";
import {
  isLikelyQuestionMarker,
  parseSubQuestionLabel,
} from "./question-number";
import { safeTrim } from "./string-normalize";

const CONTINUATION_START =
  /^(?:continued|cont\.|…|\.\.\.|and\b|also\b|hence\b|therefore\b|where\b|given\b)/i;

export interface CrossPageMergeResult {
  candidates: QuestionCandidateEvidence[];
  warnings: string[];
  merges: number;
}

/**
 * Merges candidates that belong to the same paper and continue onto the next page
 * without a new question marker.
 */
export function mergeCrossPageQuestionCandidates(
  input: QuestionCandidateEvidence[]
): CrossPageMergeResult {
  const warnings: string[] = [];
  if (input.length === 0) {
    return { candidates: [], warnings, merges: 0 };
  }

  // Work per paper, preserving paper order.
  const byPaper = new Map<number, QuestionCandidateEvidence[]>();
  for (const cand of input) {
    const list = byPaper.get(cand.paperIndex) ?? [];
    list.push(cand);
    byPaper.set(cand.paperIndex, list);
  }

  const merged: QuestionCandidateEvidence[] = [];
  let merges = 0;

  for (const [, paperCands] of [...byPaper.entries()].sort(
    (a, b) => a[0] - b[0]
  )) {
    // Sort by first source page then question index
    const ordered = [...paperCands].sort((a, b) => {
      const ap = Math.min(...a.sourcePages);
      const bp = Math.min(...b.sourcePages);
      if (ap !== bp) return ap - bp;
      return (a.questionIndex ?? 999) - (b.questionIndex ?? 999);
    });

    let current: QuestionCandidateEvidence | null = null;
    for (const cand of ordered) {
      if (!current) {
        current = { ...cand, sourcePages: [...cand.sourcePages] };
        continue;
      }

      if (shouldMergeContinuation(current, cand)) {
        current = mergeCandidates(current, cand);
        merges += 1;
        continue;
      }

      if (isAmbiguousContinuation(current, cand)) {
        warnings.push(
          `CROSS_PAGE_AMBIGUOUS:${current.provisionalId}->${cand.provisionalId}`
        );
      }

      merged.push(current);
      current = { ...cand, sourcePages: [...cand.sourcePages] };
    }
    if (current) merged.push(current);
  }

  return { candidates: merged, warnings, merges };
}

function shouldMergeContinuation(
  prev: QuestionCandidateEvidence,
  next: QuestionCandidateEvidence
): boolean {
  if (prev.paperIndex !== next.paperIndex) return false;

  const prevPage = Math.max(...prev.sourcePages);
  const nextPage = Math.min(...next.sourcePages);
  if (nextPage !== prevPage + 1) return false;

  // Next has a clear new question number different from prev → new question
  if (
    next.questionIndex != null &&
    prev.questionIndex != null &&
    next.questionIndex !== prev.questionIndex &&
    next.numberingConfidence !== "NONE"
  ) {
    return false;
  }

  if (
    next.questionIndex != null &&
    next.numberingConfidence === "HIGH" &&
    next.questionIndex !== prev.questionIndex
  ) {
    return false;
  }

  const nextText = safeTrim(next.text);
  if (isLikelyQuestionMarker(nextText) && next.numberingConfidence === "HIGH") {
    return false;
  }

  // Starts with subquestion only, or continuation wording, or unnumbered body
  if (parseSubQuestionLabel(nextText) && !isLikelyQuestionMarker(nextText)) {
    return true;
  }
  if (CONTINUATION_START.test(nextText)) {
    return true;
  }
  if (next.questionNumber == null || next.numberingConfidence === "NONE") {
    return true;
  }

  return false;
}

function isAmbiguousContinuation(
  prev: QuestionCandidateEvidence,
  next: QuestionCandidateEvidence
): boolean {
  if (prev.paperIndex !== next.paperIndex) return false;
  const prevPage = Math.max(...prev.sourcePages);
  const nextPage = Math.min(...next.sourcePages);
  if (nextPage !== prevPage + 1) return false;
  return (
    next.numberingConfidence === "LOW" || next.numberingConfidence === "MEDIUM"
  );
}

function mergeCandidates(
  prev: QuestionCandidateEvidence,
  next: QuestionCandidateEvidence
): QuestionCandidateEvidence {
  const pages = [...new Set([...prev.sourcePages, ...next.sourcePages])].sort(
    (a, b) => a - b
  );
  return {
    ...prev,
    text: `${prev.text}\n${next.text}`.trim(),
    subQuestions: [...prev.subQuestions, ...next.subQuestions],
    sourcePages: pages,
    numericalTokens: [
      ...new Set([...prev.numericalTokens, ...next.numericalTokens]),
    ],
    hasDiagram: prev.hasDiagram || next.hasDiagram,
  };
}
