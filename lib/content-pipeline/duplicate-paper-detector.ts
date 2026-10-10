/**
 * Pre-save duplicate paper detection for one-import-one-paper CMS saves.
 *
 * Uses deterministic year+month identity (same as papersMatch) plus a
 * structural content hash. Never silently overwrites without classification.
 */

import { createHash } from "node:crypto";

import { papersMatch } from "./pyq-merger";
import type { ProductionPaper, ProductionPyqsJson } from "./schema-types";
import { safeTrim } from "./string-normalize";

export type DuplicatePaperStatus = "NEW" | "DUPLICATE" | "POSSIBLE_DUPLICATE";

export interface DuplicatePaperMatch {
  status: DuplicatePaperStatus;
  year: number;
  month: string;
  exam: string;
  existingQuestionCount: number;
  incomingQuestionCount: number;
  contentHashMatch: boolean;
  identityMatch: boolean;
  existingContentHash: string | null;
  incomingContentHash: string;
  reason: string;
}

export interface DuplicatePaperReport {
  overall: DuplicatePaperStatus;
  papers: DuplicatePaperMatch[];
  /** Exact or possible duplicate present — save requires explicit confirmation. */
  requiresConfirmation: boolean;
  /** Exact duplicate only — save is a no-op merge unless confirmed. */
  isExactDuplicate: boolean;
  summary: string;
}

/**
 * Stable content identity for a production paper (questions + subquestion text).
 */
export function paperContentIdentityHash(paper: ProductionPaper): string {
  const parts: string[] = [
    String(paper.year),
    safeTrim(paper.month).toLowerCase(),
    safeTrim(paper.exam).toLowerCase(),
  ];

  const questions = [...paper.questions].sort((a, b) =>
    safeTrim(a.questionNumber).localeCompare(safeTrim(b.questionNumber))
  );

  for (const q of questions) {
    parts.push(safeTrim(q.questionNumber).toLowerCase());
    const subs = [...q.subQuestions].sort((a, b) =>
      safeTrim(a.label).localeCompare(safeTrim(b.label))
    );
    for (const sub of subs) {
      parts.push(
        safeTrim(sub.label).toLowerCase(),
        normalizeComparableText(sub.text)
      );
    }
  }

  return createHash("sha256")
    .update(parts.join("\u0001"), "utf8")
    .digest("hex");
}

function normalizeComparableText(text: unknown): string {
  return safeTrim(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.%/+-]/g, "");
}

/**
 * Classify each incoming paper against existing subject pyqs.json.
 */
export function detectDuplicatePapers(
  existing: ProductionPyqsJson | null | undefined,
  incoming: ProductionPyqsJson | null | undefined
): DuplicatePaperReport {
  if (!incoming?.papers?.length) {
    return {
      overall: "NEW",
      papers: [],
      requiresConfirmation: false,
      isExactDuplicate: false,
      summary: "No incoming papers to compare.",
    };
  }

  if (!existing?.papers?.length) {
    return {
      overall: "NEW",
      papers: incoming.papers.map((paper) => ({
        status: "NEW" as const,
        year: paper.year,
        month: paper.month,
        exam: paper.exam,
        existingQuestionCount: 0,
        incomingQuestionCount: paper.questions.length,
        contentHashMatch: false,
        identityMatch: false,
        existingContentHash: null,
        incomingContentHash: paperContentIdentityHash(paper),
        reason: "No existing papers in target subject.",
      })),
      requiresConfirmation: false,
      isExactDuplicate: false,
      summary: "All incoming papers are new for this subject.",
    };
  }

  const papers: DuplicatePaperMatch[] = [];

  for (const incomingPaper of incoming.papers) {
    const incomingHash = paperContentIdentityHash(incomingPaper);
    const match = existing.papers.find((p) => papersMatch(p, incomingPaper));

    if (!match) {
      papers.push({
        status: "NEW",
        year: incomingPaper.year,
        month: incomingPaper.month,
        exam: incomingPaper.exam,
        existingQuestionCount: 0,
        incomingQuestionCount: incomingPaper.questions.length,
        contentHashMatch: false,
        identityMatch: false,
        existingContentHash: null,
        incomingContentHash: incomingHash,
        reason: `No existing paper for ${incomingPaper.month} ${incomingPaper.year}.`,
      });
      continue;
    }

    const existingHash = paperContentIdentityHash(match);
    const contentHashMatch = existingHash === incomingHash;

    if (contentHashMatch) {
      papers.push({
        status: "DUPLICATE",
        year: incomingPaper.year,
        month: incomingPaper.month,
        exam: incomingPaper.exam,
        existingQuestionCount: match.questions.length,
        incomingQuestionCount: incomingPaper.questions.length,
        contentHashMatch: true,
        identityMatch: true,
        existingContentHash: existingHash,
        incomingContentHash: incomingHash,
        reason: `Exact duplicate of existing ${match.month} ${match.year} paper (same identity + content hash).`,
      });
      continue;
    }

    papers.push({
      status: "POSSIBLE_DUPLICATE",
      year: incomingPaper.year,
      month: incomingPaper.month,
      exam: incomingPaper.exam,
      existingQuestionCount: match.questions.length,
      incomingQuestionCount: incomingPaper.questions.length,
      contentHashMatch: false,
      identityMatch: true,
      existingContentHash: existingHash,
      incomingContentHash: incomingHash,
      reason: `Same exam identity (${match.month} ${match.year}) but different question content — human confirmation required before save.`,
    });
  }

  const hasExact = papers.some((p) => p.status === "DUPLICATE");
  const hasPossible = papers.some((p) => p.status === "POSSIBLE_DUPLICATE");
  const overall: DuplicatePaperStatus = hasExact
    ? "DUPLICATE"
    : hasPossible
      ? "POSSIBLE_DUPLICATE"
      : "NEW";

  const summary =
    overall === "NEW"
      ? "No duplicate papers detected."
      : overall === "DUPLICATE"
        ? "Exact duplicate paper(s) already exist in content — confirm before save."
        : "Possible duplicate paper(s) share exam identity with different content — confirm before save.";

  return {
    overall,
    papers,
    requiresConfirmation: hasExact || hasPossible,
    isExactDuplicate: hasExact && !hasPossible,
    summary,
  };
}
