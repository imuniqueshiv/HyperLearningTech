/**
 * Phase 1 hard upload / import limits (server-authoritative).
 */

export type ImportUploadMode = "normal_pdf" | "merged_pdf" | "images";

/** Normal single-paper PDF: max pages. */
export const MAX_NORMAL_PDF_PAGES = 5;

/** Merged multi-paper PDF: max pages. */
export const MAX_MERGED_PDF_PAGES = 15;

/** Image Import Session: max images. */
export const MAX_IMPORT_IMAGES = 15;

/** Max papers declared/accepted per Import Session. */
export const MAX_PAPERS_PER_IMPORT = 3;

/** Soft concurrency cap for in-process supervisors. */
export const MAX_CONCURRENT_PIPELINES = 1;

export const IMPORT_LIMIT_MESSAGES = {
  normalPdfPages: `Normal PDF mode supports a maximum of ${MAX_NORMAL_PDF_PAGES} pages.`,
  mergedPdfPages: `Merged PDF mode supports a maximum of ${MAX_MERGED_PDF_PAGES} pages.`,
  images: `Image mode supports a maximum of ${MAX_IMPORT_IMAGES} images per import.`,
  papers: `An Import Session supports a maximum of ${MAX_PAPERS_PER_IMPORT} papers.`,
} as const;

export function parseImportUploadMode(
  value: string | null | undefined
): ImportUploadMode | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "normal_pdf" ||
    normalized === "normal" ||
    normalized === "single"
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
    case "merged_pdf":
      return MAX_MERGED_PDF_PAGES;
    case "images":
      return MAX_IMPORT_IMAGES;
  }
}
