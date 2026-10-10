/**
 * Categorized CMS warning taxonomy for review UI and diagnostics.
 * Prefer specific codes over generic "WARNING".
 */

export type WarningSeverity = "critical" | "review_required" | "informational";

export type WarningCategory =
  | "OCR"
  | "Structure"
  | "Numbers"
  | "Tables"
  | "Metadata"
  | "Input"
  | "Evidence"
  | "Diagram"
  | "Other";

export interface CategorizedWarning {
  code: string;
  message: string;
  category: WarningCategory;
  severity: WarningSeverity;
}

export interface WarningSummary {
  critical: CategorizedWarning[];
  reviewRequired: CategorizedWarning[];
  informational: CategorizedWarning[];
  counts: {
    critical: number;
    reviewRequired: number;
    informational: number;
    total: number;
  };
}

const CODE_RULES: Array<{
  match: RegExp;
  category: WarningCategory;
  severity: WarningSeverity;
}> = [
  {
    match:
      /MERGED_PDF_UNSUPPORTED|PAPER_LIMIT_EXCEEDED|IMAGE_LIMIT_EXCEEDED|PDF_PAGE_LIMIT_EXCEEDED|EXTRACTION_INVALID|EVIDENCE_INVALID|SCHEMA_INVALID|NON_RGPV_DOCUMENT|NON_QUESTION_PAPER|INSTITUTION_CONFLICT|DOCUMENT_ELIGIBILITY_REJECTED|ONE_PAPER_REQUIRED|NO_QUESTIONS_EXTRACTED|QUESTION_COUNT_BELOW_DECLARED|QUESTION_COUNT_ABOVE_DECLARED|EMPTY_QUESTION_TEXT|OCR_CORRUPTION_SUSPECTED|EXTRACTION_QUALITY_BLOCKED|DUPLICATE_QUESTION_NUMBER/i,
    category: "Input",
    severity: "critical",
  },
  {
    match:
      /RGPV_EVIDENCE_INSUFFICIENT|DOCUMENT_TYPE_AMBIGUOUS|DOCUMENT_ELIGIBILITY_REVIEW/i,
    category: "Input",
    severity: "review_required",
  },
  {
    match: /OCR_LOW_CONFIDENCE|LOW_CONFIDENCE/i,
    category: "OCR",
    severity: "review_required",
  },
  {
    match: /OCR_CONFUSION|CONFUSION_/i,
    category: "OCR",
    severity: "review_required",
  },
  {
    match:
      /QUESTION_NUMBER_GAP|DUPLICATE_QUESTION_NUMBER|CONTINUATION_AMBIGUOUS|NUMBERING_/i,
    category: "Structure",
    severity: "review_required",
  },
  {
    match: /NUMERIC_EVIDENCE_MISMATCH|NUMERIC_|NUMBER_FIDELITY/i,
    category: "Numbers",
    severity: "review_required",
  },
  {
    match: /TABLE_AMBIGUOUS|TABLE_/i,
    category: "Tables",
    severity: "review_required",
  },
  {
    match: /METADATA_CONFLICT|METADATA_/i,
    category: "Metadata",
    severity: "review_required",
  },
  {
    match: /DIAGRAM_|BROKEN_DIAGRAM|DIAGRAM_PRESENT/i,
    category: "Diagram",
    severity: "informational",
  },
  {
    match: /PAPER_SEGMENTATION_REVIEW_REQUIRED|REVIEW_REQUIRED|HEADER_FOOTER/i,
    category: "Evidence",
    severity: "review_required",
  },
  {
    match: /POSSIBLE_DUPLICATE|DUPLICATE_PAPER|EXACT_DUPLICATE/i,
    category: "Input",
    severity: "review_required",
  },
];

/**
 * Extract a machine code prefix from free-form warning text when present.
 */
export function extractWarningCode(raw: string): string {
  const trimmed = raw.trim();
  const colon = trimmed.match(/^([A-Z][A-Z0-9_]{2,})(?:\s*[:\-–]|\s+)/);
  if (colon) return colon[1];
  const bare = trimmed.match(/^([A-Z][A-Z0-9_]{2,})$/);
  if (bare) return bare[1];
  return "UNSPECIFIED_WARNING";
}

function classifyByCode(
  code: string,
  message: string
): Pick<CategorizedWarning, "category" | "severity"> {
  for (const rule of CODE_RULES) {
    if (rule.match.test(code) || rule.match.test(message)) {
      return { category: rule.category, severity: rule.severity };
    }
  }
  return { category: "Other", severity: "informational" };
}

export function categorizeWarning(raw: string): CategorizedWarning {
  const message = raw.trim();
  const code = extractWarningCode(message);
  const { category, severity } = classifyByCode(code, message);
  return { code, message, category, severity };
}

export function summarizeWarnings(rawWarnings: string[]): WarningSummary {
  const critical: CategorizedWarning[] = [];
  const reviewRequired: CategorizedWarning[] = [];
  const informational: CategorizedWarning[] = [];

  const seen = new Set<string>();
  for (const raw of rawWarnings) {
    if (!raw?.trim()) continue;
    const key = raw.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    const categorized = categorizeWarning(key);
    if (categorized.severity === "critical") critical.push(categorized);
    else if (categorized.severity === "review_required")
      reviewRequired.push(categorized);
    else informational.push(categorized);
  }

  return {
    critical,
    reviewRequired,
    informational,
    counts: {
      critical: critical.length,
      reviewRequired: reviewRequired.length,
      informational: informational.length,
      total: critical.length + reviewRequired.length + informational.length,
    },
  };
}
