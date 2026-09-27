import type { RawDocument, RawPage, RawTextBlock } from "./raw-document";
import { CMS_ERROR_CODES, CmsStageError } from "./pipeline-errors";
import { safeTrim } from "./string-normalize";

/**
 * Minimum trimmed characters on a single page to treat native PDF text
 * (or Tesseract output) as usable.
 *
 * Forensic evidence (job_865e79db…): blank JBIG2 rasters produced 0 chars.
 * Healthy RGPV pages produced 800–1700+ OCR characters. Isolated page
 * numbers / "PTO" footers are typically under 20 characters.
 */
export const MIN_USABLE_PAGE_CHARS = 40;

/**
 * Minimum total characters across the document. A 2–4 page RGPV paper
 * with only headers would still fail this; a single sparse question page
 * with one stem usually exceeds 80 characters.
 */
export const MIN_USABLE_DOCUMENT_CHARS = 80;

/**
 * Blank JBIG2 fallback rasters were ~10 KB (1684×1191 white PNG).
 * Real rendered pages were 80–480 KB. 20 KB is a conservative ceiling
 * used together with non-white pixel sampling — never size alone.
 */
export const BLANK_RASTER_MAX_BYTES = 20_000;

/**
 * Pixel sample stride 4×4 (every 16th pixel → 64th byte). Blank pages
 * sampled 0 non-white pixels; a real page sampled ~10k.
 */
export const MIN_NONWHITE_SAMPLED = 20;

export class OcrQualityError extends CmsStageError {
  constructor(code: string, message: string, recoveryHint: string) {
    super({
      code,
      stage: "ocr",
      message,
      recoverability: "fix-input",
      recoveryHint,
    });
    this.name = "OcrQualityError";
  }
}

export interface RasterQuality {
  width: number;
  height: number;
  pngBytes: number;
  nonWhiteSampled: number;
  blank: boolean;
}

export interface OcrDocumentQuality {
  pageCount: number;
  textBlockCount: number;
  totalChars: number;
  usablePageCount: number;
  blankRasterPages: number;
  usable: boolean;
  failureCode: string | null;
  failureMessage: string | null;
}

export function pageTextCharCount(
  text: string | null | undefined,
  blocks?: RawTextBlock[]
): number {
  const joined = safeTrim(text);
  if (joined.length > 0) {
    return joined.length;
  }
  if (!blocks?.length) {
    return 0;
  }
  return safeTrim(blocks.map((block) => block.text).join(" ")).length;
}

export function isPageTextUsable(
  text: string | null | undefined,
  blocks?: RawTextBlock[]
): boolean {
  const chars = pageTextCharCount(text, blocks);
  const blockCount =
    blocks?.filter((block) => safeTrim(block.text)).length ?? 0;
  return chars >= MIN_USABLE_PAGE_CHARS || blockCount >= 8;
}

export function assessRasterPixels(input: {
  pngBytes: number;
  width: number;
  height: number;
  nonWhiteSampled: number;
}): RasterQuality {
  const tiny = input.pngBytes > 0 && input.pngBytes <= BLANK_RASTER_MAX_BYTES;
  const noInk = input.nonWhiteSampled < MIN_NONWHITE_SAMPLED;
  return {
    width: input.width,
    height: input.height,
    pngBytes: input.pngBytes,
    nonWhiteSampled: input.nonWhiteSampled,
    blank: tiny && noInk,
  };
}

export function sampleNonWhitePixels(
  pixels: Uint8ClampedArray | Uint8Array | null | undefined
): number {
  if (!pixels || pixels.length < 4) {
    return 0;
  }
  let nonWhite = 0;
  for (let i = 0; i < pixels.length; i += 64) {
    const r = pixels[i] ?? 255;
    const g = pixels[i + 1] ?? 255;
    const b = pixels[i + 2] ?? 255;
    const a = pixels[i + 3] ?? 0;
    if (a > 0 && (r < 250 || g < 250 || b < 250)) {
      nonWhite += 1;
    }
  }
  return nonWhite;
}

export function assessOcrDocument(
  document: Pick<RawDocument, "pages" | "metadata">
): OcrDocumentQuality {
  const pages = document.pages ?? [];
  let totalChars = 0;
  let usablePageCount = 0;
  let blankRasterPages = 0;

  for (const page of pages) {
    const chars = pageTextCharCount(page.text, page.textBlocks);
    totalChars += chars;
    if (isPageTextUsable(page.text, page.textBlocks)) {
      usablePageCount += 1;
    }
    if (pageIsBlankRaster(page)) {
      blankRasterPages += 1;
    }
  }

  const textBlockCount = document.metadata.textBlockCount;
  const usable = usablePageCount > 0 && totalChars >= MIN_USABLE_DOCUMENT_CHARS;

  if (usable) {
    return {
      pageCount: pages.length,
      textBlockCount,
      totalChars,
      usablePageCount,
      blankRasterPages,
      usable: true,
      failureCode: null,
      failureMessage: null,
    };
  }

  if (blankRasterPages > 0 && usablePageCount === 0) {
    return {
      pageCount: pages.length,
      textBlockCount,
      totalChars,
      usablePageCount,
      blankRasterPages,
      usable: false,
      failureCode: CMS_ERROR_CODES.PDF_RENDER_EMPTY,
      failureMessage: `PDF rasterized to blank/near-white pages (${blankRasterPages}/${pages.length}, ${totalChars} OCR chars, ${textBlockCount} blocks).`,
    };
  }

  return {
    pageCount: pages.length,
    textBlockCount,
    totalChars,
    usablePageCount,
    blankRasterPages,
    usable: false,
    failureCode: CMS_ERROR_CODES.EMPTY_OCR_TEXT,
    failureMessage: `OCR produced no usable text (${totalChars} chars, ${textBlockCount} blocks across ${pages.length} pages).`,
  };
}

export function assertOcrDocumentUsable(
  document: Pick<RawDocument, "pages" | "metadata">
): OcrDocumentQuality {
  const quality = assessOcrDocument(document);
  if (quality.usable) {
    return quality;
  }

  const hint =
    quality.failureCode === CMS_ERROR_CODES.PDF_RENDER_EMPTY
      ? "Inspect pages/page-*.png. Scanned JBIG2 PDFs require pdf.js wasmUrl pointing at pdfjs-dist/wasm/."
      : "Inspect raw-document.json and page rasters. Re-run OCR after fixing rendering.";

  throw new OcrQualityError(
    quality.failureCode ?? CMS_ERROR_CODES.EMPTY_OCR_TEXT,
    quality.failureMessage ?? "OCR output was empty.",
    hint
  );
}

function pageIsBlankRaster(page: RawPage): boolean {
  const stats = page.raster;
  if (stats) {
    return stats.blank;
  }
  return false;
}
