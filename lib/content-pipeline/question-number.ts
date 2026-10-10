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

/**
 * OCR often confuses leading "1" with "I" / "l" / "|" on scanned RGPV papers.
 * Only normalize when the marker is clearly a question opener (followed by (a)/(b) or a letter).
 * Does not invent question numbers — only repairs confusable glyphs at the marker site.
 */
export function normalizeOcrQuestionPrefix(text: string): string {
  let t = text.trim();
  // Strip a single junk capital letter prefix before a digit marker: "N 3. (a)" → "3. (a)"
  t = t.replace(/^[A-Z]\s+(?=\d{1,2}\s*[.)]\s*\()/i, "");
  // "I. (a" / "l. (a" / "|. (a" → "1. (a"
  t = t.replace(/^([Il|!])\s*[.)]\s*(?=\(?[a-zA-Z])/i, "1. ");
  // "I (a" without period
  t = t.replace(/^([Il|])\s+(?=\([a-z])/i, "1. ");
  return t;
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
  // "5. (a)" / "5.(a)" — common RGPV opener
  {
    pattern: /^(\d{1,2})\s*[.)]\s*\(([a-z])\)\s*/i,
    confidence: "HIGH",
  },
  // Two-column bleed: "8 (a)" without a period between number and sub-label
  {
    pattern: /^(\d{1,2})\s+\(([a-z])\)\s+/i,
    confidence: "MEDIUM",
  },
  // OCR often emits "5- a)" or "5 – a)" instead of "5. a)" / "5) a)"
  {
    pattern: /^(\d{1,2})\s*[-–—]\s+(?=[A-Za-z([{])/,
    confidence: "MEDIUM",
  },
  // Bare "4)" / "4:" without following content is almost always a page
  // chrome fragment on RGPV scans — do not promote to a question opener.
];

const SUB_MARKERS: Array<{
  pattern: RegExp;
  confidence: ParsedSubQuestionLabel["confidence"];
}> = [
  {
    // Prefer parenthesized / paren-closing forms — do not use "B." here
    // (collides with B.Tech / degree abbreviations).
    pattern: /^(?:\(([a-z])\)|([a-z])\))\s+/i,
    confidence: "HIGH",
  },
  {
    // "a. Explain …" — require whitespace + word char; reject B.Tech-style.
    pattern: /^([a-z])\.\s+(?=[A-Za-z([{])/i,
    confidence: "MEDIUM",
  },
  {
    pattern: /^(?:\(([ivxlcdm]+)\)|([ivxlcdm]+)\))\s+/i,
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
  const trimmed = normalizeOcrQuestionPrefix(text);
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

/**
 * OCR repairs for sub-question openers only (does not invent body text).
 * - Leading junk before "(b)": "= (b)" / ". (b)"
 * - Empty parentheses before a sentence: "() Explain" → "(b) Explain"
 *   (common when the inner letter is lost; LOW confidence).
 */
export function normalizeOcrSubQuestionPrefix(text: string): string {
  let t = text.trim();
  t = t.replace(/^[=.\-–—:_]+\s*(?=\()/u, "");
  t = t.replace(/^\(\s*\)\s+(?=[A-Z(])/u, "(b) ");
  return t;
}

const INSTRUCTION_SUB_BODY =
  /^(?:attempt\b|a?l+ questions\b|in case of any doubt\b|use suitable\b|assume\b|questions carry\b|english version\b|doubt or dispute\b)/i;

export function parseSubQuestionLabel(
  text: string
): ParsedSubQuestionLabel | null {
  const trimmed = normalizeOcrSubQuestionPrefix(text);
  if (!trimmed) return null;

  // Avoid treating "a) 2.5" mid-sentence; require short prefix
  for (const { pattern, confidence } of SUB_MARKERS) {
    const match = pattern.exec(trimmed);
    if (!match) continue;
    const letter = (match[1] ?? match[2] ?? match[3] ?? "").toLowerCase();
    if (!letter) continue;
    const after = trimmed.slice(match[0].length).trim();
    if (letter.length === 1 && letter >= "a" && letter <= "h") {
      // Reject degree / title abbreviations: "B.Tech", "M.Sc", "Ph.D"
      if (
        /^[a-z]\./i.test(match[0]) &&
        /^(?:[a-z]\.\s*)(?:tech|sc|e\.|a\.|ph\.?d|com|ed)\b/i.test(trimmed)
      ) {
        continue;
      }
      return {
        canonical: `${letter})`,
        raw: match[0].trim(),
        confidence:
          text.trim() !== trimmed && /^\(\s*\)/.test(text.trim())
            ? "LOW"
            : confidence,
      };
    }
    // roman numerals — reject exam-instruction lines (Note (i)/(ii)/(iii))
    if (/^[ivxlcdm]+$/i.test(letter) && letter.length <= 4) {
      if (INSTRUCTION_SUB_BODY.test(after)) {
        return null;
      }
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

/**
 * Find start offsets of question markers inside a (possibly packed) OCR blob.
 * Handles two-column bleed where Q1 and Q4 share one horizontal line.
 */
export function findQuestionMarkerStarts(text: string): number[] {
  const source = text;
  if (!source.trim()) return [];

  const patterns: RegExp[] = [
    // "Q.1" / "Question 2"
    /(?:^|[\s\n\r])((?:q(?:uestion|ue)?\.?\s*)(\d{1,2})\s*[.):\-–—]?)/gi,
    // "2. (a)" / "2.(a)" / "2) (a)"
    /(?:^|[\s\n\r])((\d{1,2})\s*[.)]\s*\(([a-z])\))/gi,
    // "2. Explain" (no sub-label yet)
    /(?:^|[\s\n\r])((\d{1,2})\s*[.)]\s+(?=[A-Za-z]))/gi,
    // "8 (a)" without period (column bleed)
    /(?:^|[\s\n\r])((\d{1,2})\s+\(([a-z])\)\s+)/gi,
    // OCR "I. (a" / "l. (a" as question 1
    /(?:^|[\s\n\r])(([Il|])\s*[.)]\s*\(?[a-z])/gi,
  ];

  const starts = new Set<number>();
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const marker = match[1] ?? "";
      if (!marker) continue;
      // indexOf avoids drifting past the marker when the match includes
      // trailing whitespace outside the capture group.
      const abs = match.index + match[0].indexOf(marker);
      const slice = source.slice(abs);
      if (
        parseQuestionNumber(slice) ||
        parseQuestionNumber(normalizeOcrQuestionPrefix(slice))
      ) {
        starts.add(abs);
      }
    }
  }

  return [...starts].sort((a, b) => a - b);
}

/**
 * Split a long OCR blob into segments that each begin with a question marker.
 * Used when multi-column / bilingual OCR packs several questions into one block.
 * Does not invent markers — only splits on evidence already present in the text.
 */
export function splitTextByQuestionMarkers(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const ordered = findQuestionMarkerStarts(trimmed);
  if (ordered.length <= 1) {
    // Still return normalized single segment when I./l. can be parsed as Q.1
    return [trimmed];
  }

  const segments: string[] = [];
  for (let i = 0; i < ordered.length; i += 1) {
    const end = i + 1 < ordered.length ? ordered[i + 1] : trimmed.length;
    const part = trimmed.slice(ordered[i], end).trim();
    if (part) segments.push(part);
  }
  return segments.length > 0 ? segments : [trimmed];
}

/**
 * Character offsets of sub-question markers inside a blob, including mid-line
 * "(b)" after instruction text or after an "(a)" opener in the same OCR line.
 */
export function findSubQuestionMarkerStarts(text: string): number[] {
  const source = text;
  if (!source.trim()) return [];

  const patterns: RegExp[] = [
    /(?:^|[\s\n\r=.\-–—:_])(\(([a-z])\))\s+/gi,
    /(?:^|[\s\n\r=.\-–—:_])(([a-z])\))\s+/gi,
    // Empty parens OCR loss: "() Explain"
    /(?:^|[\s\n\r=.\-–—:_])(\(\s*\))\s+(?=[A-Z])/g,
  ];

  const starts = new Set<number>();
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const marker = match[1] ?? "";
      if (!marker) continue;
      const abs = match.index + match[0].indexOf(marker);
      const slice = source.slice(abs);
      if (parseSubQuestionLabel(slice)) {
        starts.add(abs);
      }
    }
  }

  return [...starts].sort((a, b) => a - b);
}

/**
 * Split a blob on sub-question markers when more than one is present
 * (e.g. instruction "(iii) … (b) Describe …").
 */
export function splitTextBySubQuestionMarkers(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const ordered = findSubQuestionMarkerStarts(trimmed);
  if (ordered.length <= 1) {
    return [trimmed];
  }

  const segments: string[] = [];
  // Preserve any preamble before the first sub marker (rare).
  if (ordered[0] > 0) {
    const preamble = trimmed.slice(0, ordered[0]).trim();
    if (preamble) segments.push(preamble);
  }
  for (let i = 0; i < ordered.length; i += 1) {
    const end = i + 1 < ordered.length ? ordered[i + 1] : trimmed.length;
    const part = trimmed.slice(ordered[i], end).trim();
    if (part) segments.push(part);
  }
  return segments.length > 0 ? segments : [trimmed];
}

/**
 * Split packed OCR into question / sub-question evidence segments with
 * character ranges for horizontal bbox slicing on column-bleed lines.
 */
export function splitOcrBlockIntoMarkerSegments(text: string): Array<{
  text: string;
  start: number;
  end: number;
}> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const qStarts = findQuestionMarkerStarts(trimmed);

  const ranges: Array<{ start: number; end: number }> = [];
  if (qStarts.length > 1) {
    for (let i = 0; i < qStarts.length; i += 1) {
      ranges.push({
        start: qStarts[i],
        end: i + 1 < qStarts.length ? qStarts[i + 1] : trimmed.length,
      });
    }
  } else if (qStarts.length === 1 && qStarts[0] > 0) {
    ranges.push({ start: 0, end: qStarts[0] });
    ranges.push({ start: qStarts[0], end: trimmed.length });
  } else {
    ranges.push({ start: 0, end: trimmed.length });
  }

  const segments: Array<{ text: string; start: number; end: number }> = [];
  for (const range of ranges) {
    const slice = trimmed.slice(range.start, range.end);
    // Keep "2. (a) …" intact; only split later mid-line markers such as
    // "… English version (b) Describe …".
    const localSubs = findSubQuestionMarkerStarts(slice).filter(
      (offset) =>
        offset > 0 && !isImmediateSubAfterQuestionPrefix(slice, offset)
    );
    if (localSubs.length === 0) {
      pushTrimmedSegment(segments, trimmed, range.start, range.end);
      continue;
    }

    const cuts = [0, ...localSubs, slice.length];
    for (let i = 0; i < cuts.length - 1; i += 1) {
      pushTrimmedSegment(
        segments,
        trimmed,
        range.start + cuts[i],
        range.start + cuts[i + 1]
      );
    }
  }

  return segments.length > 0
    ? segments
    : [{ text: trimmed, start: 0, end: trimmed.length }];
}

function pushTrimmedSegment(
  segments: Array<{ text: string; start: number; end: number }>,
  source: string,
  start: number,
  end: number
): void {
  const raw = source.slice(start, end);
  const lead = raw.length - raw.trimStart().length;
  const trail = raw.length - raw.trimEnd().length;
  const text = raw.trim();
  if (!text) return;
  segments.push({
    text,
    start: start + lead,
    end: end - trail,
  });
}

/** True when "(a)" is the opener immediately after "2." / "Q.2" / "I.". */
function isImmediateSubAfterQuestionPrefix(
  slice: string,
  subOffset: number
): boolean {
  const before = slice.slice(0, subOffset).trim();
  if (!before) return true;
  return (
    /^(?:q(?:uestion|ue)?\.?\s*)?\d{1,2}\s*[.)]?$/i.test(before) ||
    /^[Il|!]\s*[.)]?$/i.test(before) ||
    // Partial OCR of "(a)" where the cut landed on "a)" after "2. ("
    /^(?:q(?:uestion|ue)?\.?\s*)?\d{1,2}\s*[.)]?\s*\($/i.test(before) ||
    /^[Il|!]\s*[.)]?\s*\($/i.test(before)
  );
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
