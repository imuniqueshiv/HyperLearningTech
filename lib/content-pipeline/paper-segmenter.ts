/**
 * Phase 2: Single-paper identity for an Import Session.
 * Multi-paper segmentation is out of product scope.
 */

import type { RawDocument, RawPage } from "./raw-document";
import { safeTrim } from "./string-normalize";

export type PaperSegmentConfidence = "HIGH" | "MEDIUM" | "LOW";

export type PaperSegmentationStatus =
  | "HIGH_CONFIDENCE"
  | "REVIEW_REQUIRED"
  | "INVALID";

export interface PaperSegment {
  paperIndex: number;
  paperId: string;
  pageNumbers: number[];
  confidence: PaperSegmentConfidence;
  reasons: string[];
  headerHints: {
    subjectCode: string | null;
    examSession: string | null;
    year: number | null;
  };
}

export interface PaperSegmentationResult {
  papers: PaperSegment[];
  warnings: string[];
  reviewRequired: boolean;
  status: PaperSegmentationStatus;
}

const SUBJECT_CODE = /\b([A-Z]{1,3}[-–—]?\d{2,4}(?:[-–—]\d)?)\b/;
const YEAR = /\b(20[0-2]\d)\b/;
const SESSION =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i;

/**
 * Assigns a single paper identity (`paper-1`) to the entire document.
 * Declared paper counts > 1 are ignored (product: one paper per import).
 */
export function segmentPapers(
  raw: RawDocument,
  declaredPaperCount: number = 1
): PaperSegmentationResult {
  const warnings: string[] = [];
  const pages = [...raw.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  if (pages.length === 0) {
    return {
      papers: [],
      warnings: ["NO_PAGES"],
      reviewRequired: true,
      status: "INVALID",
    };
  }

  if (declaredPaperCount > 1) {
    warnings.push("MULTI_PAPER_DECLARATION_IGNORED");
  }

  return {
    papers: [
      {
        paperIndex: 1,
        paperId: "paper-1",
        pageNumbers: pages.map((p) => p.pageNumber),
        confidence: "HIGH",
        reasons: ["single-paper-import"],
        headerHints: extractHeaderHints(pages[0]),
      },
    ],
    warnings,
    reviewRequired: false,
    status: "HIGH_CONFIDENCE",
  };
}

function extractHeaderHints(page: RawPage): PaperSegment["headerHints"] {
  const text = page.textBlocks
    .slice(0, 12)
    .map((b) => safeTrim(b.text))
    .join(" ");
  const yearRaw = YEAR.exec(text)?.[1];
  return {
    subjectCode: SUBJECT_CODE.exec(text)?.[1]?.replace(/[–—]/g, "-") ?? null,
    examSession: SESSION.exec(text)?.[1] ?? null,
    year: yearRaw ? Number.parseInt(yearRaw, 10) : null,
  };
}
