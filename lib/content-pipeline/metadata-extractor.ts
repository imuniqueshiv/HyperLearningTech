/**
 * Deterministic Import Session metadata extraction.
 * Sources: filename, OCR/document text, repository subject catalog.
 * Never calls Gemini. Never invents values without evidence.
 */

import fs from "fs/promises";
import path from "path";

import { safeTrim } from "./string-normalize";
import type { ExamSession } from "./types";

export type MetadataSource =
  | "filename"
  | "ocr"
  | "document"
  | "catalog"
  | "admin";

export type MetadataConfidenceBand = "high" | "medium" | "low";

export interface ExtractedField<T> {
  value: T | null;
  confidence: number;
  source: MetadataSource | null;
  needsConfirmation: boolean;
  evidence: string | null;
}

export interface ExtractedImportMetadata {
  branch: ExtractedField<string>;
  semester: ExtractedField<string>;
  subjectCode: ExtractedField<string>;
  year: ExtractedField<number>;
  examSession: ExtractedField<ExamSession>;
  alternatives: {
    subjectCodes: string[];
    branches: string[];
  };
}

export interface SubjectCatalogEntry {
  branch: string;
  semester: string;
  subjectCode: string;
}

export interface ExtractMetadataInput {
  filename?: string | null;
  ocrText?: string | null;
  catalog?: SubjectCatalogEntry[];
  /** Fields already set by the administrator — never overwritten. */
  overrides?: Partial<{
    branch: string | null;
    semester: string | null;
    subjectCode: string | null;
    year: number | null;
    examSession: ExamSession | null;
  }>;
}

const HIGH = 0.85;
const MEDIUM = 0.55;

const BRANCH_ALIASES: Record<string, string[]> = {
  aiml: [
    "aiml",
    "ai-ml",
    "ai & ml",
    "ai and ml",
    "artificial intelligence and machine learning",
    "artificial intelligence",
  ],
  cse: ["cse", "computer science engineering", "computer science"],
  csit: ["csit", "information technology"],
  cscy: ["cscy", "cyber security", "cybersecurity"],
  common: ["common", "first year", "1st year"],
  me: ["me", "mechanical"],
  ce: ["ce", "civil"],
  ee: ["ee", "electrical"],
  ec: ["ec", "electronics"],
};

const ROMAN: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
};

function emptyField<T>(): ExtractedField<T> {
  return {
    value: null,
    confidence: 0,
    source: null,
    needsConfirmation: true,
    evidence: null,
  };
}

function field<T>(
  value: T,
  confidence: number,
  source: MetadataSource,
  evidence: string
): ExtractedField<T> {
  const band = confidenceBand(confidence);
  return {
    value,
    confidence,
    source,
    needsConfirmation: band !== "high",
    evidence,
  };
}

export function confidenceBand(confidence: number): MetadataConfidenceBand {
  if (confidence >= HIGH) return "high";
  if (confidence >= MEDIUM) return "medium";
  return "low";
}

export function normalizeSubjectCode(raw: string): string | null {
  const cleaned = safeTrim(raw).toUpperCase().replace(/[._]/g, "-");
  if (!cleaned) return null;
  const match = cleaned.match(/^([A-Z]{2,6})-?(\d{3})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export function normalizeSemester(raw: string): string | null {
  const text = safeTrim(raw).toLowerCase();
  if (!text) return null;
  const already = text.match(/^semester-(\d{1,2})$/);
  if (already) return `semester-${Number(already[1])}`;
  const roman = text.match(/\b(viii|vii|vi|iv|v|iii|ii|i)\b/);
  if (roman && ROMAN[roman[1]]) {
    return `semester-${ROMAN[roman[1]]}`;
  }
  const digit =
    text.match(/\b(?:semester|sem)\s*[-.]?\s*(\d{1,2})\b/) ??
    text.match(/\b(\d{1,2})(?:st|nd|rd|th)\s+semester\b/);
  if (digit) {
    const n = Number(digit[1]);
    if (n >= 1 && n <= 8) return `semester-${n}`;
  }
  return null;
}

export function normalizeBranch(raw: string): string | null {
  const text = safeTrim(raw).toLowerCase();
  if (!text) return null;
  for (const [canonical, aliases] of Object.entries(BRANCH_ALIASES)) {
    if (text === canonical || aliases.includes(text)) {
      return canonical;
    }
  }
  return text.replace(/[^a-z0-9-]/g, "") || null;
}

export function parseExamSession(
  raw: string | null | undefined
): ExamSession | null {
  const text = safeTrim(raw).toLowerCase();
  if (!text) return null;
  if (/\b(june|jun)\b/.test(text)) return "June";
  if (/\b(november|nov)\b/.test(text)) return "November";
  if (/\b(december|dec)\b/.test(text)) return "December";
  return null;
}

/** Academic paper years accepted by CMS metadata / schema overlay. */
export function isValidExamYear(year: unknown): year is number {
  return (
    typeof year === "number" &&
    Number.isFinite(year) &&
    year >= 2000 &&
    year <= 2099
  );
}

export function isExamSession(value: unknown): value is ExamSession {
  return value === "June" || value === "November" || value === "December";
}

export function parseYear(raw: string | null | undefined): number | null {
  const match = safeTrim(raw).match(/\b(20\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2099 ? year : null;
}

/**
 * AL/CD-402, al-cd-402, AL402 → ["AL-402", "CD-402"] or ["AL-402"].
 */
export function extractSubjectCodes(text: string): string[] {
  const found = new Set<string>();
  const source = text.replace(/\\/g, "/");

  const slash = source.matchAll(
    /\b([A-Za-z]{2,5}(?:\s*\/\s*[A-Za-z]{2,5})+)\s*[-–]?\s*(\d{3})\b/g
  );
  for (const match of slash) {
    const prefixes = match[1].split(/\s*\/\s*/);
    for (const prefix of prefixes) {
      const code = normalizeSubjectCode(`${prefix}-${match[2]}`);
      if (code) found.add(code);
    }
  }

  const dashed = source.matchAll(
    /\b([A-Za-z]{2,5})(?:[-_]([A-Za-z]{2,5}))*[-_]?(\d{3})\b/g
  );
  for (const match of dashed) {
    const n = match[3];
    const whole = match[0];
    const prefixes = whole
      .replace(/[-_]?(\d{3})$/, "")
      .split(/[-_/]/)
      .filter(Boolean);
    if (prefixes.length === 0) continue;
    for (const prefix of prefixes) {
      const code = normalizeSubjectCode(`${prefix}-${n}`);
      if (code) found.add(code);
    }
  }

  return [...found];
}

export function extractMetadata(
  input: ExtractMetadataInput
): ExtractedImportMetadata {
  const filename = safeTrim(input.filename);
  const ocrText = safeTrim(input.ocrText);
  const catalog = input.catalog ?? [];
  const combined = `${filename}\n${ocrText}`;

  const filenameCodes = extractSubjectCodes(filename);
  const ocrCodes = extractSubjectCodes(ocrText);
  const codes = unique([...ocrCodes, ...filenameCodes]);

  const yearFromFile = parseYear(filename);
  const yearFromOcr = parseYear(ocrText);
  const sessionFromFile = parseExamSession(filename);
  const sessionFromOcr = parseExamSession(ocrText);
  const semesterFromOcr = normalizeSemester(ocrText);
  const semesterFromFile = normalizeSemester(filename);

  let subjectCode = emptyField<string>();
  let branch = emptyField<string>();
  let semester = emptyField<string>();

  if (codes.length === 1) {
    const source: MetadataSource = ocrCodes.includes(codes[0])
      ? "ocr"
      : "filename";
    subjectCode = field(
      codes[0],
      source === "ocr" ? 0.96 : 0.93,
      source,
      codes[0]
    );
  } else if (codes.length > 1) {
    const preferred = preferCatalogCode(codes, catalog) ?? codes[0];
    subjectCode = field(
      preferred,
      0.7,
      ocrCodes.length ? "ocr" : "filename",
      codes.join(", ")
    );
    subjectCode.needsConfirmation = true;
  }

  const matches = catalog.filter((entry) =>
    codes.some((code) => code.toLowerCase() === entry.subjectCode.toLowerCase())
  );
  const uniqueBranches = unique(matches.map((entry) => entry.branch));
  const uniqueSemesters = unique(matches.map((entry) => entry.semester));

  if (uniqueBranches.length === 1 && codes.length === 1) {
    branch = field(uniqueBranches[0], 0.96, "catalog", uniqueBranches[0]);
  } else if (uniqueBranches.length === 1 && codes.length > 1) {
    branch = field(
      uniqueBranches[0],
      0.7,
      "catalog",
      `Document lists ${codes.join("/")}; catalog maps ${uniqueBranches[0]}`
    );
  } else if (uniqueBranches.length > 1) {
    branch = emptyField();
    branch.evidence = uniqueBranches.join(", ");
    branch.needsConfirmation = true;
  } else {
    const hinted = inferBranchFromText(combined);
    if (hinted) {
      branch = field(
        hinted.value,
        hinted.confidence,
        hinted.source,
        hinted.evidence
      );
    }
  }

  if (semesterFromOcr) {
    semester = field(semesterFromOcr, 0.92, "ocr", semesterFromOcr);
  } else if (semesterFromFile) {
    semester = field(semesterFromFile, 0.8, "filename", semesterFromFile);
  } else if (uniqueSemesters.length === 1) {
    semester = field(uniqueSemesters[0], 0.9, "catalog", uniqueSemesters[0]);
  } else if (uniqueSemesters.length > 1) {
    semester = emptyField();
    semester.evidence = uniqueSemesters.join(", ");
    semester.needsConfirmation = true;
  }

  const year =
    yearFromOcr != null
      ? field(yearFromOcr, 0.97, "ocr", String(yearFromOcr))
      : yearFromFile != null
        ? field(yearFromFile, 0.95, "filename", String(yearFromFile))
        : emptyField<number>();

  const examSession = sessionFromOcr
    ? field(sessionFromOcr, 0.97, "ocr", sessionFromOcr)
    : sessionFromFile
      ? field(sessionFromFile, 0.95, "filename", sessionFromFile)
      : emptyField<ExamSession>();

  const applied = applyOverrides(
    { branch, semester, subjectCode, year, examSession },
    input.overrides
  );

  return {
    ...applied,
    alternatives: {
      subjectCodes: codes,
      branches: uniqueBranches,
    },
  };
}

export function applyHighConfidenceMetadata(
  current: {
    branch: string | null;
    semester: string | null;
    subjectCode: string | null;
    year: number | null;
    examSession: ExamSession | null;
  },
  extracted: ExtractedImportMetadata,
  manualOverrides?: Partial<Record<keyof typeof current, boolean>>
): typeof current {
  const next = { ...current };
  const keys = [
    "branch",
    "semester",
    "subjectCode",
    "year",
    "examSession",
  ] as const;

  for (const key of keys) {
    if (manualOverrides?.[key]) {
      continue;
    }
    if (current[key] != null && current[key] !== "") {
      continue;
    }
    const extractedField = extracted[key];
    if (extractedField.value == null) {
      continue;
    }
    if (extractedField.confidence >= MEDIUM) {
      (next as Record<string, unknown>)[key] = extractedField.value;
    }
  }

  return next;
}

export async function loadSubjectCatalog(
  rootDir: string = path.join(process.cwd(), "content", "rgpv")
): Promise<SubjectCatalogEntry[]> {
  const entries: SubjectCatalogEntry[] = [];
  let branches: string[] = [];
  try {
    branches = await fs.readdir(rootDir);
  } catch {
    return entries;
  }

  for (const branch of branches) {
    const branchDir = path.join(rootDir, branch);
    let semesters: string[] = [];
    try {
      semesters = await fs.readdir(branchDir);
    } catch {
      continue;
    }
    for (const semester of semesters) {
      if (!semester.startsWith("semester-")) continue;
      const semesterDir = path.join(branchDir, semester);
      let subjects: string[] = [];
      try {
        subjects = await fs.readdir(semesterDir);
      } catch {
        continue;
      }
      for (const subject of subjects) {
        const code = normalizeSubjectCode(subject);
        if (!code) continue;
        entries.push({ branch, semester, subjectCode: code });
      }
    }
  }

  return entries;
}

function applyOverrides(
  extracted: Omit<ExtractedImportMetadata, "alternatives">,
  overrides: ExtractMetadataInput["overrides"]
): Omit<ExtractedImportMetadata, "alternatives"> {
  if (!overrides) return extracted;
  const next = { ...extracted };

  if (safeTrim(overrides.branch)) {
    next.branch = field(
      normalizeBranch(overrides.branch!) ?? overrides.branch!,
      1,
      "admin",
      "admin"
    );
    next.branch.needsConfirmation = false;
  }
  if (safeTrim(overrides.semester)) {
    next.semester = field(
      normalizeSemester(overrides.semester!) ?? overrides.semester!,
      1,
      "admin",
      "admin"
    );
    next.semester.needsConfirmation = false;
  }
  if (safeTrim(overrides.subjectCode)) {
    next.subjectCode = field(
      normalizeSubjectCode(overrides.subjectCode!) ?? overrides.subjectCode!,
      1,
      "admin",
      "admin"
    );
    next.subjectCode.needsConfirmation = false;
  }
  if (isValidExamYear(overrides.year)) {
    next.year = field(overrides.year, 1, "admin", String(overrides.year));
    next.year.needsConfirmation = false;
  }
  if (isExamSession(overrides.examSession)) {
    next.examSession = field(
      overrides.examSession,
      1,
      "admin",
      overrides.examSession
    );
    next.examSession.needsConfirmation = false;
  }

  return next;
}

function preferCatalogCode(
  codes: string[],
  catalog: SubjectCatalogEntry[]
): string | null {
  const inCatalog = codes.filter((code) =>
    catalog.some(
      (entry) => entry.subjectCode.toLowerCase() === code.toLowerCase()
    )
  );
  return inCatalog.length === 1 ? inCatalog[0] : null;
}

function inferBranchFromText(text: string): {
  value: string;
  confidence: number;
  source: MetadataSource;
  evidence: string;
} | null {
  const lower = text.toLowerCase();
  for (const [canonical, aliases] of Object.entries(BRANCH_ALIASES)) {
    for (const alias of aliases) {
      if (alias.length < 4) continue;
      if (lower.includes(alias)) {
        return {
          value: canonical,
          confidence: 0.72,
          source: "ocr",
          evidence: alias,
        };
      }
    }
  }
  return null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
