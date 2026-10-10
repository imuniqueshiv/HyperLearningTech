/**
 * English-first cleanup for bilingual RGPV OCR.
 * Removes Devanagari / Indic script runs without inventing replacement English.
 * Does not paraphrase — only drops non-Latin script and collapses whitespace.
 */

const DEVANAGARI_RUN = /[\u0900-\u097F]+(?:\s*[\u0900-\u097F]+)*/g;
const OTHER_INDIC =
  /[\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+/g;

/** True when the string contains a meaningful Devanagari (or other Indic) run. */
export function containsIndicScript(text: string): boolean {
  return /[\u0900-\u097F]/.test(text) || OTHER_INDIC.test(text);
}

/**
 * Prefer English for public PYQ content: strip Indic script runs and
 * collapse leftover punctuation/space. Preserves Latin letters, digits,
 * and common exam punctuation.
 */
export function preferEnglishExamText(text: string): string {
  if (!text) return "";
  let out = text.replace(DEVANAGARI_RUN, " ").replace(OTHER_INDIC, " ");
  // Drop isolated OCR junk left beside removed Hindi (common on bleed lines).
  out = out.replace(/[|¦]+/g, " ");
  out = repairCommonOcrConfusables(out);
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

/**
 * Conservative OCR glyph/spacing repairs — does not invent exam content.
 * Mirrors normalizeOcrQuestionPrefix: only fixes known confusable forms.
 */
export function repairCommonOcrConfusables(text: string): string {
  let t = text;
  t = t.replace(/\bWhatis\b/g, "What is");
  t = t.replace(/\bWhatare\b/g, "What are");
  // Learning misread as Leaming / Leaning in eng OCR on this paper family.
  t = t.replace(
    /\b(Machine|Unsupervised|model)\s+Lea[nm]ing\b/gi,
    "$1 Learning"
  );
  t = t.replace(/\bLea[nm]ing\b/g, "Learning");
  return t;
}

/**
 * Fraction of characters that are Latin letters / digits / common punctuation.
 * Used as a soft fidelity signal — not a rewrite rule.
 */
export function latinScriptRatio(text: string): number {
  const trimmed = text.replace(/\s+/g, "");
  if (!trimmed.length) return 0;
  const latin = trimmed.replace(/[^A-Za-z0-9.,;:()%+\-/=?'"]/g, "");
  return latin.length / trimmed.length;
}
