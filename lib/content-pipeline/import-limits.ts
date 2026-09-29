/**
 * Phase 1/2 hard upload / import limits (server-authoritative).
 *
 * Product scope (Phase 2 final):
 * - ONE academic paper per Import Session
 * - PDF ≤ 5 pages
 * - Images ≤ 5 (ordered pages of the same paper)
 * - Merged multi-paper PDF imports are NOT supported
 */

export type ImportUploadMode = "normal_pdf" | "images";

/** Deprecated alias retained for error messaging only — never accepted. */
export type DeprecatedImportUploadMode = "merged_pdf";

/** Single-paper PDF: max pages. */
export const MAX_NORMAL_PDF_PAGES = 5;

/**
 * @deprecated Merged multi-paper imports removed from product scope.
 * Kept only so older clients receive a clear rejection message.
 */
export const MAX_MERGED_PDF_PAGES = 5;

/** Image Import Session: max images (pages of one paper). */
export const MAX_IMPORT_IMAGES = 5;

/** Max papers per Import Session — always 1. */
export const MAX_PAPERS_PER_IMPORT = 1;

/** Soft concurrency cap for in-process supervisors. */
export const MAX_CONCURRENT_PIPELINES = 1;

/** Bounded OCR page parallelism (max 5 pages). Overridable via CMS_OCR_PAGE_CONCURRENCY.
 * Empirically (4-page scanned OCR wall, 3 runs each):
 *   c=1 avg 21.1s | c=2 avg 16.5s | c=3 avg 15.2s | c=4 avg 12.8s
 * OCR-only confirms c=4 fastest (avg 6.7s) without worsening variance.
 * Default 4 = max pages in product scope; still capped by page count.
 */
export function getOcrPageConcurrency(): number {
  return Math.min(
    5,
    Math.max(1, Number(process.env.CMS_OCR_PAGE_CONCURRENCY) || 4)
  );
}

/** @deprecated Prefer getOcrPageConcurrency() so env overrides apply at call time. */
export const OCR_PAGE_CONCURRENCY = getOcrPageConcurrency();

export const IMPORT_LIMIT_MESSAGES = {
  normalPdfPages: `PDF imports support a maximum of ${MAX_NORMAL_PDF_PAGES} pages (one paper).`,
  mergedPdfPages:
    "Merged multi-paper PDF imports are not supported. Split papers into separate imports (≤5 pages each).",
  images: `Image mode supports a maximum of ${MAX_IMPORT_IMAGES} images per import (one paper).`,
  papers: `An Import Session accepts exactly ${MAX_PAPERS_PER_IMPORT} paper.`,
  mergedModeUnsupported:
    "Merged PDF mode is disabled. Upload one paper per import (PDF ≤5 pages or 1–5 images).",
} as const;

export function parseImportUploadMode(
  value: string | null | undefined
): ImportUploadMode | "merged_pdf" | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "normal_pdf" ||
    normalized === "normal" ||
    normalized === "single" ||
    normalized === "pdf"
  ) {
    return "normal_pdf";
  }
  if (
    normalized === "merged_pdf" ||
    normalized === "merged" ||
    normalized === "multi"
  ) {
    return "merged_pdf";
  }
  if (normalized === "images" || normalized === "image") {
    return "images";
  }
  return null;
}

export function maxPagesForMode(mode: ImportUploadMode): number {
  switch (mode) {
    case "normal_pdf":
      return MAX_NORMAL_PDF_PAGES;
    case "images":
      return MAX_IMPORT_IMAGES;
  }
}
