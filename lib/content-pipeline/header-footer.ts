/**
 * Phase 2: Detect repeated page headers/footers without destroying question text.
 */

import type { RawDocument, RawPage } from "./raw-document";
import { safeTrim } from "./string-normalize";

export interface HeaderFooterDetection {
  repeatedHeaders: string[];
  repeatedFooters: string[];
  pageNumberOnlyPages: number[];
  warnings: string[];
  /** Normalized page texts with repeated chrome removed (evidence preserved separately). */
  cleanedPageTexts: Map<number, string>;
}

const PAGE_NUM_ONLY = /^(?:page\s*)?\d{1,3}(?:\s*\/\s*\d{1,3})?$/i;

/**
 * Finds strings that repeat across ≥50% of pages in header/footer bands.
 * Never mutates RawDocument; returns cleaned text for downstream use.
 */
export function detectRepeatedHeaderFooter(
  raw: RawDocument
): HeaderFooterDetection {
  const warnings: string[] = [];
  const pages = [...raw.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  if (pages.length < 2) {
    return {
      repeatedHeaders: [],
      repeatedFooters: [],
      pageNumberOnlyPages: pages
        .filter((p) => PAGE_NUM_ONLY.test(safeTrim(p.text)))
        .map((p) => p.pageNumber),
      warnings,
      cleanedPageTexts: new Map(
        pages.map((p) => [p.pageNumber, safeTrim(p.text)])
      ),
    };
  }

  const headerCounts = new Map<string, number>();
  const footerCounts = new Map<string, number>();
  const pageNumberOnlyPages: number[] = [];

  for (const page of pages) {
    const header = bandText(page, "header");
    const footer = bandText(page, "footer");
    if (header) headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1);
    if (footer) footerCounts.set(footer, (footerCounts.get(footer) ?? 0) + 1);
    if (PAGE_NUM_ONLY.test(safeTrim(page.text))) {
      pageNumberOnlyPages.push(page.pageNumber);
    }
  }

  const threshold = Math.max(2, Math.ceil(pages.length * 0.5));
  const repeatedHeaders = [...headerCounts.entries()]
    .filter(([, n]) => n >= threshold)
    .map(([t]) => t);
  const repeatedFooters = [...footerCounts.entries()]
    .filter(([, n]) => n >= threshold)
    .map(([t]) => t);

  if (repeatedHeaders.length > 0) {
    warnings.push("REPEATED_HEADER_DETECTED");
  }
  if (repeatedFooters.length > 0) {
    warnings.push("REPEATED_FOOTER_DETECTED");
  }
  if (pageNumberOnlyPages.length > 0) {
    warnings.push("PAGE_NUMBER_ONLY_PAGES");
  }

  const cleanedPageTexts = new Map<number, string>();
  for (const page of pages) {
    let text = safeTrim(page.text);
    for (const h of repeatedHeaders) {
      if (text.startsWith(h)) text = safeTrim(text.slice(h.length));
      text = text
        .split("\n")
        .filter((line) => safeTrim(line) !== h)
        .join("\n");
    }
    for (const f of repeatedFooters) {
      if (text.endsWith(f)) text = safeTrim(text.slice(0, -f.length));
      text = text
        .split("\n")
        .filter((line) => safeTrim(line) !== f)
        .join("\n");
    }
    // Strip lone page numbers from ends only
    const lines = text.split("\n");
    while (lines.length && PAGE_NUM_ONLY.test(safeTrim(lines[0]))) {
      lines.shift();
    }
    while (
      lines.length &&
      PAGE_NUM_ONLY.test(safeTrim(lines[lines.length - 1]))
    ) {
      lines.pop();
    }
    cleanedPageTexts.set(page.pageNumber, lines.join("\n").trim());
  }

  return {
    repeatedHeaders,
    repeatedFooters,
    pageNumberOnlyPages,
    warnings,
    cleanedPageTexts,
  };
}

function bandText(page: RawPage, band: "header" | "footer"): string {
  const yThresh = band === "header" ? 0.12 : 0.88;
  const blocks = page.textBlocks
    .filter((b) => {
      const yRatio = b.bbox.y / Math.max(page.height, 1);
      return band === "header" ? yRatio <= yThresh : yRatio >= yThresh;
    })
    .sort((a, b) => a.bbox.y - b.bbox.y)
    .map((b) => safeTrim(b.text))
    .filter(Boolean);
  // Header chrome is usually 1–2 short lines; avoid swallowing question text.
  if (band === "header") {
    return blocks.slice(0, 2).join(" ").trim();
  }
  return blocks.slice(-2).join(" ").trim();
}
