/**
 * Phase 2: Question / sub-question number detection.
 * Distinguishes structural identifiers (Q.1, 1), a)) from numerical content (2.5, 2025).
 */

export interface ParsedQuestionNumber {
  /** Canonical form e.g. "Q.1" */
  canonical: string;
  /** Numeric index (1-based) */
  index: number;
  /** Raw matched marker text */
  raw: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface ParsedSubQuestionLabel {
  canonical: string;
  raw: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

/** Leading question markers (line start). */
const QUESTION_MARKERS: Array<{
  pattern: RegExp;
  confidence: ParsedQuestionNumber["confidence"];
}> = [
  {
    pattern:
      /^(?:q(?:uestion|ue)?\.?\s*|q\s*[-.]?\s*)(\d{1,2})\s*[.):\-–—]?\s*/i,
    confidence: "HIGH",
  },
  {
    pattern: /^(\d{1,2})\s*[.)]\s+(?=[A-Za-z([{])/,
    confidence: "MEDIUM",
  },
  // OCR often emits "5- a)" or "5 – a)" instead of "5. a)" / "5) a)"
  {
    pattern: /^(\d{1,2})\s*[-–—]\s+(?=[A-Za-z([{])/,
    confidence: "MEDIUM",
  },
  {
    pattern: /^(\d{1,2})\s*[):]\s*$/,
    confidence: "LOW",
  },
];

const SUB_MARKERS: Array<{
  pattern: RegExp;
  confidence: ParsedSubQuestionLabel["confidence"];
}> = [
  {
    pattern: /^(?:\(([a-z])\)|([a-z])\)|([a-z])\.)\s*/i,
    confidence: "HIGH",
  },
  {
    pattern: /^(?:\(([ivxlcdm]+)\)|([ivxlcdm]+)\))\s*/i,
    confidence: "MEDIUM",
  },
];

/** Values that look like decimals / years / measurements — not Q numbers. */
const NUMERIC_CONTENT =
  /^(?:\d+\.\d+|\d{4}|\d+\s*(?:kg|g|m|cm|mm|v|a|ω|ohm|%|bit|bits|hz|ms|ns)\b)/i;

/**
 * Attempts to parse a question number from the start of a text block.
 * Returns null when the text is numerical content or not a marker.
 */
export function parseQuestionNumber(text: string): ParsedQuestionNumber | null {
  const trimmed = text.trim();
  if (!trimmed || NUMERIC_CONTENT.test(trimmed)) {
    return null;
  }

  // Reject fractions like 1/2 at start
  if (/^\d+\s*\/\s*\d+/.test(trimmed)) {
    return null;
  }

  for (const { pattern, confidence } of QUESTION_MARKERS) {
    const match = pattern.exec(trimmed);
    if (!match) continue;
    const index = Number.parseInt(match[1] ?? "", 10);
    if (!Number.isFinite(index) || index < 1 || index > 40) {
      continue;
    }
    // Guard: "1.5 kg" style after digit
    const after = trimmed.slice(match[0].length);
    if (/^\d/.test(after) && confidence !== "HIGH") {
      continue;
    }
    return {
      canonical: `Q.${index}`,
      index,
      raw: match[0].trim(),
      confidence,
    };
  }

  return null;
}

export function parseSubQuestionLabel(
  text: string
): ParsedSubQuestionLabel | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Avoid treating "a) 2.5" mid-sentence; require short prefix
  for (const { pattern, confidence } of SUB_MARKERS) {
    const match = pattern.exec(trimmed);
    if (!match) continue;
    const letter = (match[1] ?? match[2] ?? match[3] ?? "").toLowerCase();
    if (!letter) continue;
    if (letter.length === 1 && letter >= "a" && letter <= "h") {
      return {
        canonical: `${letter})`,
        raw: match[0].trim(),
        confidence,
      };
    }
    // roman numerals
    if (/^[ivxlcdm]+$/i.test(letter) && letter.length <= 4) {
      return {
        canonical: `${letter})`,
        raw: match[0].trim(),
        confidence: confidence === "HIGH" ? "MEDIUM" : confidence,
      };
    }
  }

  // Combined form: Q.1(a) / 1(a)
  const combined =
    /^(?:q\.?\s*)?(\d{1,2})\s*\(([a-z])\)\s*/i.exec(trimmed) ??
    /^(\d{1,2})\(([a-z])\)\s*/i.exec(trimmed);
  if (combined) {
    return {
      canonical: `${combined[2].toLowerCase()})`,
      raw: combined[0].trim(),
      confidence: "HIGH",
    };
  }

  return null;
}

export function isLikelyQuestionMarker(text: string): boolean {
  return parseQuestionNumber(text) !== null;
}

export function isLikelySubQuestionMarker(text: string): boolean {
  return parseSubQuestionLabel(text) !== null;
}

/**
 * Extracts numerical tokens for evidence comparison (not for rewriting source).
 */
export function extractNumericalTokens(text: string): string[] {
  const tokens = new Set<string>();
  const patterns = [
    /-?\d+\.\d+/g,
    /-?\d+/g,
    /\d+\s*\/\s*\d+/g,
    /\d+\s*[×x*]\s*10\s*[\^⁻]?\s*-?\d+/gi,
    /\d+\s*%/g,
    /\bP\s*\(\s*[A-Za-z]\s*\|\s*[A-Za-z]\s*\)/g,
    /\b\d+\s*[-–—]\s*bit\b/gi,
    /\b\d+\s*(?:V|Ω|ohm|A|mA|kHz|Hz|W)\b/gi,
    /\b[01]{4,}\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const normalized = normalizeNumericToken(match[0]);
      if (normalized) tokens.add(normalized);
    }
  }
  return [...tokens];
}

/** Comparison-only normalization — does not mutate pipeline output. */
export function normalizeNumericToken(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, "").replace(/×/gi, "x").toLowerCase();
  if (!cleaned) return null;
  // Drop lone years used as metadata unless comparison needs them
  return cleaned;
}

/**
 * Detects gaps / duplicates in ordered question indices.
 */
export function analyzeQuestionNumberSequence(indices: number[]): {
  duplicates: number[];
  gaps: number[];
  sortedUnique: number[];
} {
  const sorted = [...indices].filter((n) => n > 0).sort((a, b) => a - b);
  const duplicates: number[] = [];
  const seen = new Set<number>();
  for (const n of sorted) {
    if (seen.has(n)) duplicates.push(n);
    seen.add(n);
  }
  const unique = [...seen].sort((a, b) => a - b);
  const gaps: number[] = [];
  if (unique.length >= 2) {
    for (let i = unique[0]; i <= unique[unique.length - 1]; i += 1) {
      if (!seen.has(i)) gaps.push(i);
    }
  }
  return { duplicates, gaps, sortedUnique: unique };
}
