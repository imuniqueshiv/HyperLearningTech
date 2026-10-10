/**
 * RGPV examination question-paper eligibility gate.
 *
 * Deterministic multi-signal scoring — never a single includes("RGPV") check.
 * Gemini is NOT used here; OCR text is untrusted document data.
 */

import { parseQuestionNumber } from "./question-number";

export type InstitutionStatus =
  | "RGPV_CONFIRMED"
  | "NON_RGPV_CONFIRMED"
  | "INSTITUTION_UNKNOWN";

export type DocumentTypeStatus =
  | "QUESTION_PAPER"
  | "NON_QUESTION_PAPER"
  | "DOCUMENT_TYPE_AMBIGUOUS";

export type DocumentEligibilityStatus =
  | "DOCUMENT_ELIGIBILITY_PASSED"
  | "DOCUMENT_ELIGIBILITY_REVIEW_REQUIRED"
  | "DOCUMENT_ELIGIBILITY_REJECTED";

export type DocumentEligibilityCode =
  | "NON_RGPV_DOCUMENT"
  | "NON_QUESTION_PAPER"
  | "RGPV_EVIDENCE_INSUFFICIENT"
  | "DOCUMENT_TYPE_AMBIGUOUS"
  | "INSTITUTION_CONFLICT"
  | "ELIGIBILITY_PASSED";

export interface EligibilitySignal {
  id: string;
  polarity: "positive" | "negative" | "neutral";
  weight: number;
  detail: string;
}

export interface DocumentEligibilityResult {
  status: DocumentEligibilityStatus;
  institution: InstitutionStatus;
  documentType: DocumentTypeStatus;
  codes: DocumentEligibilityCode[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  institutionScore: number;
  questionPaperScore: number;
  nonQuestionPaperScore: number;
  nonRgpvScore: number;
  signals: EligibilitySignal[];
  summary: string;
  adminTitle: string;
  adminDetails: string[];
  evaluatedAt: string;
  /** True when pipeline must stop before Gemini / save. */
  blocksPipeline: boolean;
  /** True when save/approve require explicit human confirmation (review path). */
  requiresHumanReview: boolean;
}

export interface EligibilityInput {
  /** Full OCR / native text across pages. */
  text: string;
  /** Optional per-page texts for header-weighted scoring. */
  pageTexts?: string[];
  /** Total OCR character count (may be 0 for blank). */
  charCount?: number;
  /** Filename hint only — never authoritative alone. */
  filename?: string | null;
}

const RGPV_FULL_NAME =
  /rajiv\s+gandhi\s+proudyogiki\s+vishwavidyalaya(?:\s*,?\s*bhopal)?/gi;

const RGPV_TOKEN = /\brgpv\b/gi;

/** Official RGPV exam/site watermarks common on scanned papers. */
const RGPV_SITE = /\brgpvonline\.com\b|\brgpv\.ac\.in\b|\brgpv\.edu\b/gi;

/** Comparative / incidental mentions — do not alone confirm institution. */
const RGPV_COMPARATIVE =
  /\b(?:compare|comparison|versus|vs\.?|difference\s+between|contrast)\b[\s\S]{0,80}\brgpv\b|\brgpv\b[\s\S]{0,80}\b(?:compare|comparison|versus|vs\.?|with\s+[A-Z][A-Za-z]+(?:\s+University)?)/gi;

const NON_RGPV_INSTITUTIONS: Array<{ id: string; pattern: RegExp }> = [
  {
    id: "delhi",
    pattern: /\buniversity\s+of\s+delhi\b|\bdu\s+examination\b/gi,
  },
  {
    id: "jntu",
    pattern:
      /\bjawaharlal\s+nehru\s+technological\s+university\b|\bjntu[a-z]?\b/gi,
  },
  {
    id: "vtu",
    pattern: /\bvisvesvaraya\s+technological\s+university\b|\bvtu\b/gi,
  },
  { id: "anna", pattern: /\banna\s+university\b/gi },
  {
    id: "mumbai",
    pattern: /\buniversity\s+of\s+mumbai\b|\bmumbai\s+university\b/gi,
  },
  {
    id: "pune",
    pattern:
      /\bsavitribai\s+phule\s+pune\s+university\b|\buniversity\s+of\s+pune\b/gi,
  },
  {
    id: "aktu",
    pattern:
      /\bdr\.?\s*a\.?\s*p\.?\s*j\.?\s*abdul\s+kalam\s+technical\s+university\b|\baktu\b/gi,
  },
  { id: "gtu", pattern: /\bgujarat\s+technological\s+university\b|\bgtu\b/gi },
  {
    id: "wbute",
    pattern:
      /\bmaulana\s+abul\s+kalam\s+azad\s+university\b|\bmakaut\b|\bwbute?\b/gi,
  },
  {
    id: "bits",
    pattern: /\bbirla\s+institute\s+of\s+technology\b|\bbits\s+pilani\b/gi,
  },
  {
    id: "iit",
    pattern: /\bindian\s+institute\s+of\s+technology\b|\biit[\s-]/gi,
  },
  {
    id: "nit",
    pattern: /\bnational\s+institute\s+of\s+technology\b|\bnit[\s-]/gi,
  },
  { id: "generic_other", pattern: /\b(?:abc|xyz)\s+university\b/gi },
  {
    id: "other_named_university",
    pattern:
      /\b(?!rajiv\s+gandhi)[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+University\b/g,
  },
];

const QUESTION_PAPER_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  weight: number;
}> = [
  {
    id: "max_marks",
    pattern:
      /\b(?:maximum\s+marks|max\.?\s*marks|m\.?\s*m\.?)\s*[:.]?\s*\d{2,3}\b/gi,
    weight: 2.5,
  },
  {
    id: "time_duration",
    pattern:
      /\b(?:time\s*(?:allowed|allotted)?|duration)\s*[:.]?\s*\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/gi,
    weight: 2,
  },
  {
    id: "attempt_any",
    pattern: /\battempt\s+any\b|\banswer\s+any\b|\battempt\s+all\b/gi,
    weight: 2.5,
  },
  {
    id: "note_instructions",
    pattern: /\bnote\s*[:.-]\s*(?:i\)|1\)|attempt|answer)/gi,
    weight: 1.5,
  },
  {
    id: "exam_session",
    pattern:
      /\b(?:june|december|november|may|jan(?:uary)?|july)\s*-?\s*(?:20)?\d{2}\b|\b(?:end\s+sem(?:ester)?|mid\s+sem(?:ester)?)\s+exam/gi,
    weight: 1.5,
  },
  {
    id: "subject_code",
    pattern: /\b[A-Z]{1,4}[- ]?\d{3}\b/,
    weight: 1.2,
  },
  {
    id: "semester",
    pattern: /\b(?:semester|sem)\s*[-.]?\s*(?:[1-8]|i{1,3}|iv|v|vi{0,3})\b/gi,
    weight: 1.2,
  },
  {
    id: "total_questions",
    pattern: /\btotal\s+(?:no\.?\s+of\s+)?questions?\b/gi,
    weight: 1,
  },
];

const NON_QUESTION_PAPER_PATTERNS: Array<{
  id: string;
  pattern: RegExp;
  weight: number;
}> = [
  {
    id: "syllabus",
    pattern:
      /\bsyllabus\b|\bcourse\s+outcomes?\b|\bunit[- ]?\s*[1-5]\s*[:.-]\s*(?:hours|topics)\b|\bscheme\s+of\s+examination\b|\blecture\s+tutorial\s+practical\b|\bL-T-P\b/gi,
    weight: 4,
  },
  {
    id: "timetable",
    pattern: /\btime[- ]?table\b|\bexam\s+schedule\b|\bdate\s+sheet\b/gi,
    weight: 4,
  },
  {
    id: "notice_circular",
    pattern:
      /\bcircular\b|\bnotice\b|\bnotification\b|\boffice\s+order\b|\bimportant\s+announcement\b/gi,
    weight: 3.5,
  },
  {
    id: "handbook_certificate",
    pattern: /\bhandbook\b|\bcertificate\b|\btranscript\b|\badmit\s+card\b/gi,
    weight: 3.5,
  },
  {
    id: "notes_textbook",
    pattern:
      /\blecture\s+notes\b|\bstudy\s+material\b|\bchapter\s+\d+\b|\btextbook\b|\btable\s+of\s+contents\b/gi,
    weight: 3,
  },
];

function countMatches(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  return (text.match(re) ?? []).length;
}

function headerSlice(
  pageTexts: string[] | undefined,
  fullText: string
): string {
  if (pageTexts && pageTexts.length > 0) {
    return pageTexts.map((p) => p.slice(0, Math.min(900, p.length))).join("\n");
  }
  return fullText.slice(0, Math.min(1800, fullText.length));
}

function detectQuestionMarkers(text: string): {
  count: number;
  uniqueIndices: number[];
} {
  const lines = text.split(/\r?\n/);
  const indices = new Set<number>();
  let count = 0;
  for (const line of lines) {
    const parsed = parseQuestionNumber(line);
    if (parsed && parsed.index >= 1 && parsed.index <= 20) {
      count += 1;
      indices.add(parsed.index);
    }
  }
  // Fallback: body-wide Q.n markers when line breaks are poor
  if (count < 2) {
    const body = text.match(/\bQ\.?\s*(\d{1,2})\b/gi) ?? [];
    for (const m of body) {
      const n = Number(m.replace(/\D/g, ""));
      if (n >= 1 && n <= 20) {
        count += 1;
        indices.add(n);
      }
    }
  }
  return { count, uniqueIndices: [...indices].sort((a, b) => a - b) };
}

/**
 * Evaluate whether OCR text is an RGPV examination question paper.
 */
export function evaluateDocumentEligibility(
  input: EligibilityInput
): DocumentEligibilityResult {
  const text = (input.text ?? "").replace(/\u0000/g, " ");
  const normalized = text.replace(/\s+/g, " ").trim();
  const charCount = input.charCount ?? normalized.length;
  const header = headerSlice(input.pageTexts, text);
  const signals: EligibilitySignal[] = [];
  const codes: DocumentEligibilityCode[] = [];

  let institutionScore = 0;
  let nonRgpvScore = 0;
  let questionPaperScore = 0;
  let nonQuestionPaperScore = 0;

  // --- Institution: RGPV ---
  const fullNameHits = countMatches(text, RGPV_FULL_NAME);
  const headerFullName = countMatches(header, RGPV_FULL_NAME);
  if (fullNameHits > 0) {
    const w = 5 + (headerFullName > 0 ? 2 : 0);
    institutionScore += w;
    signals.push({
      id: "rgpv_full_name",
      polarity: "positive",
      weight: w,
      detail: `Full university name matched (${fullNameHits}).`,
    });
  }

  const comparativeHits = countMatches(text, RGPV_COMPARATIVE);
  const rgpvTokenHits = countMatches(text, RGPV_TOKEN);
  const headerRgpv = countMatches(header, RGPV_TOKEN);
  const siteHits = countMatches(text, RGPV_SITE);
  const incidentalRgpv = Math.max(0, rgpvTokenHits - comparativeHits);

  if (siteHits > 0) {
    const w = 4.5 + Math.min(siteHits, 3) * 0.5;
    institutionScore += w;
    signals.push({
      id: "rgpv_official_site",
      polarity: "positive",
      weight: w,
      detail: `Official RGPV site watermark (${siteHits}).`,
    });
  }

  if (headerRgpv > 0 && headerFullName === 0) {
    institutionScore += 3;
    signals.push({
      id: "rgpv_header_token",
      polarity: "positive",
      weight: 3,
      detail: "RGPV token in page header region.",
    });
  } else if (incidentalRgpv > 0 && comparativeHits === 0) {
    institutionScore += 2;
    signals.push({
      id: "rgpv_token",
      polarity: "positive",
      weight: 2,
      detail: `RGPV token occurrences (${incidentalRgpv}).`,
    });
  }

  if (comparativeHits > 0 && fullNameHits === 0 && headerRgpv === 0) {
    institutionScore = Math.max(0, institutionScore - 2);
    signals.push({
      id: "rgpv_comparative_only",
      polarity: "negative",
      weight: 2,
      detail:
        "RGPV appears only in comparative/incidental phrasing — not institutional confirmation.",
    });
  }

  // Filename never alone confirms, but can support
  const fn = (input.filename ?? "").toLowerCase();
  if (/\brgpv\b/.test(fn) || /rajiv/.test(fn)) {
    institutionScore += 0.5;
    signals.push({
      id: "filename_rgpv_hint",
      polarity: "neutral",
      weight: 0.5,
      detail: "Filename hints RGPV (supporting only).",
    });
  }

  // --- Institution: non-RGPV ---
  for (const inst of NON_RGPV_INSTITUTIONS) {
    const hits =
      countMatches(header, inst.pattern) + countMatches(text, inst.pattern);
    if (hits <= 0) continue;
    // Downgrade generic "X University" if RGPV full name already confirmed
    if (inst.id === "other_named_university" && fullNameHits > 0) continue;
    // Avoid double-counting RGPV as other university via capitalized words
    if (inst.id === "other_named_university") {
      const otherUnis = text.match(
        /\b(?!Rajiv\s+Gandhi)[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+University\b/g
      );
      const filtered = (otherUnis ?? []).filter(
        (u) => !/rajiv\s+gandhi|proudyogiki|rgpv/i.test(u)
      );
      if (filtered.length === 0) continue;
      const w = 4;
      nonRgpvScore += w;
      signals.push({
        id: `non_rgpv_${inst.id}`,
        polarity: "negative",
        weight: w,
        detail: `Other institution detected: ${filtered[0]}.`,
      });
      continue;
    }
    const w = inst.id === "generic_other" ? 5 : 4.5;
    nonRgpvScore += w;
    signals.push({
      id: `non_rgpv_${inst.id}`,
      polarity: "negative",
      weight: w,
      detail: `Conflicting institution signal (${inst.id}, hits=${hits}).`,
    });
  }

  // --- Document type: question paper ---
  const qMarkers = detectQuestionMarkers(text);
  if (qMarkers.uniqueIndices.length >= 3) {
    questionPaperScore += 4;
    signals.push({
      id: "question_numbers_strong",
      polarity: "positive",
      weight: 4,
      detail: `Distinct question numbers: ${qMarkers.uniqueIndices.join(", ")}.`,
    });
  } else if (qMarkers.uniqueIndices.length >= 2 || qMarkers.count >= 2) {
    questionPaperScore += 2.5;
    signals.push({
      id: "question_numbers_moderate",
      polarity: "positive",
      weight: 2.5,
      detail: `Question markers detected (unique=${qMarkers.uniqueIndices.length}).`,
    });
  } else if (qMarkers.count === 1) {
    questionPaperScore += 1;
    signals.push({
      id: "question_numbers_weak",
      polarity: "neutral",
      weight: 1,
      detail: "Only one question marker detected.",
    });
  }

  const subQ = (text.match(/\([a-e]\)|[a-e]\)\s+/gi) ?? []).length;
  if (subQ >= 3) {
    questionPaperScore += 1.5;
    signals.push({
      id: "subquestions",
      polarity: "positive",
      weight: 1.5,
      detail: `Subquestion markers (~${subQ}).`,
    });
  }

  for (const rule of QUESTION_PAPER_PATTERNS) {
    const hits = countMatches(text, rule.pattern);
    if (hits <= 0) continue;
    questionPaperScore += rule.weight;
    signals.push({
      id: `qp_${rule.id}`,
      polarity: "positive",
      weight: rule.weight,
      detail: `Question-paper cue: ${rule.id} (hits=${hits}).`,
    });
  }

  // --- Document type: non-question-paper ---
  for (const rule of NON_QUESTION_PAPER_PATTERNS) {
    const hits = countMatches(text, rule.pattern);
    if (hits <= 0) continue;
    nonQuestionPaperScore += rule.weight * Math.min(hits, 3);
    signals.push({
      id: `non_qp_${rule.id}`,
      polarity: "negative",
      weight: rule.weight,
      detail: `Non-question-paper cue: ${rule.id} (hits=${hits}).`,
    });
  }

  // Thin / blank content
  if (charCount < 40) {
    signals.push({
      id: "insufficient_text",
      polarity: "negative",
      weight: 3,
      detail: `Very little extractable text (${charCount} chars).`,
    });
  }

  // --- Classify institution ---
  let institution: InstitutionStatus = "INSTITUTION_UNKNOWN";
  if (nonRgpvScore >= 4 && institutionScore < 4) {
    institution = "NON_RGPV_CONFIRMED";
  } else if (institutionScore >= 4.5 && nonRgpvScore < 3) {
    institution = "RGPV_CONFIRMED";
  } else if (institutionScore >= 4 && nonRgpvScore >= 4) {
    institution = "INSTITUTION_UNKNOWN"; // conflict handled below
    codes.push("INSTITUTION_CONFLICT");
  } else if (institutionScore >= 3 && nonRgpvScore < 2) {
    institution = "RGPV_CONFIRMED";
  } else {
    institution = "INSTITUTION_UNKNOWN";
  }

  if (institution === "INSTITUTION_UNKNOWN" && institutionScore < 3) {
    codes.push("RGPV_EVIDENCE_INSUFFICIENT");
  }
  if (institution === "NON_RGPV_CONFIRMED") {
    codes.push("NON_RGPV_DOCUMENT");
  }

  // --- Classify document type ---
  let documentType: DocumentTypeStatus = "DOCUMENT_TYPE_AMBIGUOUS";
  if (nonQuestionPaperScore >= 4 && questionPaperScore < 3.5) {
    documentType = "NON_QUESTION_PAPER";
    codes.push("NON_QUESTION_PAPER");
  } else if (questionPaperScore >= 5 && nonQuestionPaperScore < 3) {
    documentType = "QUESTION_PAPER";
  } else if (questionPaperScore >= 3.5 && nonQuestionPaperScore < 4) {
    documentType = "QUESTION_PAPER";
  } else {
    documentType = "DOCUMENT_TYPE_AMBIGUOUS";
    codes.push("DOCUMENT_TYPE_AMBIGUOUS");
  }

  // --- Decision ---
  let status: DocumentEligibilityStatus =
    "DOCUMENT_ELIGIBILITY_REVIEW_REQUIRED";
  let confidence: DocumentEligibilityResult["confidence"] = "MEDIUM";

  if (institution === "NON_RGPV_CONFIRMED") {
    status = "DOCUMENT_ELIGIBILITY_REJECTED";
    confidence = "HIGH";
  } else if (codes.includes("INSTITUTION_CONFLICT")) {
    status = "DOCUMENT_ELIGIBILITY_REJECTED";
    confidence = "HIGH";
  } else if (
    documentType === "NON_QUESTION_PAPER" &&
    nonQuestionPaperScore >= 4
  ) {
    status = "DOCUMENT_ELIGIBILITY_REJECTED";
    confidence = nonQuestionPaperScore >= 6 ? "HIGH" : "MEDIUM";
  } else if (
    institution === "RGPV_CONFIRMED" &&
    documentType === "QUESTION_PAPER" &&
    questionPaperScore >= 5 &&
    institutionScore >= 4
  ) {
    status = "DOCUMENT_ELIGIBILITY_PASSED";
    confidence = "HIGH";
    codes.length = 0;
    codes.push("ELIGIBILITY_PASSED");
  } else if (
    institution === "RGPV_CONFIRMED" &&
    documentType === "QUESTION_PAPER"
  ) {
    status = "DOCUMENT_ELIGIBILITY_PASSED";
    confidence = "MEDIUM";
    codes.length = 0;
    codes.push("ELIGIBILITY_PASSED");
  } else if (charCount < 40) {
    status = "DOCUMENT_ELIGIBILITY_REVIEW_REQUIRED";
    confidence = "LOW";
  } else {
    status = "DOCUMENT_ELIGIBILITY_REVIEW_REQUIRED";
    confidence =
      institution === "INSTITUTION_UNKNOWN" ||
      documentType === "DOCUMENT_TYPE_AMBIGUOUS"
        ? "LOW"
        : "MEDIUM";
  }

  const adminDetails: string[] = [];
  const institutionLabel =
    institution === "RGPV_CONFIRMED"
      ? "RGPV"
      : institution === "NON_RGPV_CONFIRMED"
        ? "Not RGPV"
        : "Insufficient evidence";
  const typeLabel =
    documentType === "QUESTION_PAPER"
      ? "Examination Question Paper"
      : documentType === "NON_QUESTION_PAPER"
        ? "Not a question paper"
        : "Ambiguous document type";

  adminDetails.push(`Institution: ${institutionLabel}`);
  adminDetails.push(`Document type: ${typeLabel}`);
  adminDetails.push(`Confidence: ${confidence}`);

  let adminTitle: string;
  let summary: string;
  if (status === "DOCUMENT_ELIGIBILITY_PASSED") {
    adminTitle = "RGPV Question Paper";
    summary = "Document eligibility passed — RGPV examination question paper.";
  } else if (status === "DOCUMENT_ELIGIBILITY_REJECTED") {
    adminTitle = "Upload rejected";
    summary =
      codes.includes("NON_RGPV_DOCUMENT") ||
      codes.includes("INSTITUTION_CONFLICT")
        ? "Rejected: document is not an eligible RGPV examination paper."
        : "Rejected: document is not an examination question paper.";
  } else {
    adminTitle = "Upload requires review";
    summary =
      "Eligibility ambiguous — human review required before authoritative save.";
  }

  // Deduplicate codes
  const uniqueCodes = [...new Set(codes)];

  return {
    status,
    institution,
    documentType,
    codes: uniqueCodes,
    confidence,
    institutionScore,
    questionPaperScore,
    nonQuestionPaperScore,
    nonRgpvScore,
    signals,
    summary,
    adminTitle,
    adminDetails,
    evaluatedAt: new Date().toISOString(),
    blocksPipeline: status === "DOCUMENT_ELIGIBILITY_REJECTED",
    requiresHumanReview: status !== "DOCUMENT_ELIGIBILITY_PASSED",
  };
}

/** True when eligibility allows Gemini/structuring to proceed. */
export function eligibilityAllowsStructuring(
  result: DocumentEligibilityResult
): boolean {
  return result.status !== "DOCUMENT_ELIGIBILITY_REJECTED";
}

/** True when save may proceed (PASSED, or REVIEW_REQUIRED after human approval). */
export function eligibilityAllowsSave(
  result: DocumentEligibilityResult | null | undefined
): { ok: boolean; code: string; message: string } {
  if (!result) {
    return {
      ok: false,
      code: "ELIGIBILITY_MISSING",
      message:
        "Document eligibility result missing. Re-run pipeline before save.",
    };
  }
  if (result.status === "DOCUMENT_ELIGIBILITY_REJECTED") {
    return {
      ok: false,
      code: result.codes[0] ?? "DOCUMENT_ELIGIBILITY_REJECTED",
      message: result.summary,
    };
  }
  // PASSED and REVIEW_REQUIRED both may save only after APPROVED stage
  // (REVIEW_REQUIRED still needs human approval — enforced elsewhere).
  return { ok: true, code: "OK", message: result.summary };
}
