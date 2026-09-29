/**
 * Phase 2: Structured extraction evidence — authoritative source for AI normalization.
 */

import type { RawDocument, RawTable } from "./raw-document";
import type { StructuredDocument } from "./structured-document";
import {
  analyzeQuestionNumberSequence,
  extractNumericalTokens,
  parseQuestionNumber,
  parseSubQuestionLabel,
} from "./question-number";
import { segmentPapers, type PaperSegmentationResult } from "./paper-segmenter";
import { mergeCrossPageQuestionCandidates } from "./question-continuation";
import { detectRepeatedHeaderFooter } from "./header-footer";
import { safeTrim } from "./string-normalize";

export const DIAGRAM_PRESENT_MARKER = "[DIAGRAM_PRESENT]";

export interface QuestionCandidateEvidence {
  provisionalId: string;
  paperId: string;
  paperIndex: number;
  questionNumber: string | null;
  questionIndex: number | null;
  subQuestions: Array<{ label: string | null; text: string }>;
  text: string;
  sourcePages: number[];
  numericalTokens: string[];
  hasDiagram: boolean;
  numberingConfidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
}

export interface ExtractionEvidence {
  version: 1;
  jobId: string;
  paperSegmentation: PaperSegmentationResult;
  questionCandidates: QuestionCandidateEvidence[];
  numericalTokens: string[];
  tables: Array<{
    id: string;
    pageNumber: number;
    rows: number;
    columns: number;
    cells: Array<{ row: number; column: number; text: string }>;
  }>;
  warnings: string[];
  instructions: string[];
}

/**
 * Builds evidence package from RawDocument + StructuredDocument.
 */
export function buildExtractionEvidence(input: {
  raw: RawDocument;
  structured: StructuredDocument;
  declaredPaperCount?: number;
}): ExtractionEvidence {
  const paperSegmentation = segmentPapers(
    input.raw,
    input.declaredPaperCount ?? 1
  );
  const warnings = [...paperSegmentation.warnings];
  const numericalTokens = new Set<string>();
  const instructions: string[] = [];

  const chrome = detectRepeatedHeaderFooter(input.raw);
  warnings.push(...chrome.warnings);

  for (const page of input.raw.pages) {
    for (const block of page.textBlocks) {
      for (const token of extractNumericalTokens(block.text)) {
        numericalTokens.add(token);
      }
      if (isInstructionLine(block.text)) {
        instructions.push(safeTrim(block.text));
      }
    }
  }

  const tables = input.raw.tables.map((table) => summarizeTable(table));

  const questionCandidatesRaw = collectQuestionCandidates(
    input.structured,
    paperSegmentation,
    warnings
  );

  // When layout produced no question nodes (often due to degenerate OCR bboxes
  // on historical artifacts), fall back to scanning raw text blocks directly.
  const withFallback =
    questionCandidatesRaw.length > 0
      ? questionCandidatesRaw
      : collectQuestionCandidatesFromRaw(
          input.raw,
          paperSegmentation,
          warnings
        );

  const continued = mergeCrossPageQuestionCandidates(withFallback);
  warnings.push(...continued.warnings);
  const questionCandidates = continued.candidates;

  // Sequence analysis per paper
  const byPaper = new Map<number, number[]>();
  for (const q of questionCandidates) {
    if (q.questionIndex != null) {
      const list = byPaper.get(q.paperIndex) ?? [];
      list.push(q.questionIndex);
      byPaper.set(q.paperIndex, list);
    } else {
      warnings.push(`UNNUMBERED_QUESTION:${q.provisionalId}`);
    }
  }
  for (const [paperIndex, indices] of byPaper) {
    const { duplicates, gaps } = analyzeQuestionNumberSequence(indices);
    for (const d of duplicates) {
      warnings.push(`DUPLICATE_QUESTION_NUMBER:paper${paperIndex}:Q.${d}`);
    }
    for (const g of gaps) {
      warnings.push(`QUESTION_NUMBER_GAP:paper${paperIndex}:Q.${g}`);
    }
  }

  return {
    version: 1,
    jobId: input.raw.metadata.jobId,
    paperSegmentation,
    questionCandidates,
    numericalTokens: [...numericalTokens],
    tables,
    warnings,
    instructions: dedupeStrings(instructions).slice(0, 40),
  };
}

function collectQuestionCandidates(
  structured: StructuredDocument,
  segmentation: PaperSegmentationResult,
  warnings: string[]
): QuestionCandidateEvidence[] {
  const candidates: QuestionCandidateEvidence[] = [];
  let autoId = 0;

  for (const node of Object.values(structured.nodes)) {
    if (node.kind !== "question") continue;
    if (!("text" in node)) continue;

    const pageNumber = node.pageNumber;
    const paperIndex = paperIndexForPage(segmentation, pageNumber);
    const paperId =
      segmentation.papers.find((p) => p.paperIndex === paperIndex)?.paperId ??
      `paper-${paperIndex}`;
    const parsed = parseQuestionNumber(node.text);
    const bodyTexts = collectChildTexts(structured, node.id);
    const fullText = [node.text, ...bodyTexts].join("\n").trim();
    const subQuestions = collectSubQuestions(structured, node.id);
    const hasDiagram =
      hasFigureChild(structured, node.id) ||
      /\[DIAGRAM_PRESENT\]/i.test(fullText);

    if (hasDiagram && !/\[DIAGRAM_PRESENT\]/i.test(fullText)) {
      // Ensure marker is available for downstream
      warnings.push(`DIAGRAM_PRESENT:page${pageNumber}`);
    }

    autoId += 1;
    candidates.push({
      provisionalId: node.id || `q-cand-${autoId}`,
      paperId,
      paperIndex,
      questionNumber: parsed?.canonical ?? null,
      questionIndex: parsed?.index ?? null,
      subQuestions,
      text: hasDiagram ? ensureDiagramMarker(fullText) : fullText,
      sourcePages: [pageNumber],
      numericalTokens: extractNumericalTokens(fullText),
      hasDiagram,
      numberingConfidence: parsed?.confidence ?? "NONE",
    });
  }

  // Sort by paper then question index (unnumbered last)
  candidates.sort((a, b) => {
    if (a.paperIndex !== b.paperIndex) return a.paperIndex - b.paperIndex;
    const ai = a.questionIndex ?? 999;
    const bi = b.questionIndex ?? 999;
    return ai - bi;
  });

  return candidates;
}

/**
 * Fallback when StructuredDocument has no question nodes — common when OCR
 * bboxes were full-page and every line was misclassified as header.
 */
function collectQuestionCandidatesFromRaw(
  raw: RawDocument,
  segmentation: PaperSegmentationResult,
  warnings: string[]
): QuestionCandidateEvidence[] {
  warnings.push("QUESTION_CANDIDATES_FROM_RAW_FALLBACK");
  const candidates: QuestionCandidateEvidence[] = [];
  let autoId = 0;

  for (const page of [...raw.pages].sort(
    (a, b) => a.pageNumber - b.pageNumber
  )) {
    const paperIndex = paperIndexForPage(segmentation, page.pageNumber);
    const paperId =
      segmentation.papers.find((p) => p.paperIndex === paperIndex)?.paperId ??
      `paper-${paperIndex}`;

    let current: QuestionCandidateEvidence | null = null;
    for (const block of page.textBlocks) {
      const parsed = parseQuestionNumber(block.text);
      const sub = parseSubQuestionLabel(block.text);
      if (parsed) {
        if (current) candidates.push(current);
        autoId += 1;
        current = {
          provisionalId: `raw-q-${autoId}`,
          paperId,
          paperIndex,
          questionNumber: parsed.canonical,
          questionIndex: parsed.index,
          subQuestions: [],
          text: block.text,
          sourcePages: [page.pageNumber],
          numericalTokens: extractNumericalTokens(block.text),
          hasDiagram: false,
          numberingConfidence: parsed.confidence,
        };
        continue;
      }
      if (!current) continue;
      if (sub) {
        current.subQuestions.push({
          label: sub.canonical,
          text: block.text,
        });
      }
      current.text = `${current.text}\n${block.text}`.trim();
      current.numericalTokens = [
        ...new Set([
          ...current.numericalTokens,
          ...extractNumericalTokens(block.text),
        ]),
      ];
    }
    if (current) candidates.push(current);
  }

  candidates.sort((a, b) => {
    if (a.paperIndex !== b.paperIndex) return a.paperIndex - b.paperIndex;
    return (a.questionIndex ?? 999) - (b.questionIndex ?? 999);
  });
  return candidates;
}

function collectChildTexts(
  structured: StructuredDocument,
  parentId: string
): string[] {
  const parent = structured.nodes[parentId];
  if (!parent) return [];
  const texts: string[] = [];
  for (const childId of parent.childIds) {
    const child = structured.nodes[childId];
    if (!child) continue;
    if (child.kind === "sub_question") continue;
    if (child.kind === "figure" || child.kind === "table") continue;
    if ("text" in child && typeof child.text === "string") {
      texts.push(child.text);
    }
  }
  return texts;
}

function collectSubQuestions(
  structured: StructuredDocument,
  questionId: string
): Array<{ label: string | null; text: string }> {
  const parent = structured.nodes[questionId];
  if (!parent) return [];
  const result: Array<{ label: string | null; text: string }> = [];
  for (const childId of parent.childIds) {
    const child = structured.nodes[childId];
    if (!child || child.kind !== "sub_question" || !("text" in child)) continue;
    const parsed = parseSubQuestionLabel(child.text);
    const body = collectChildTexts(structured, child.id);
    result.push({
      label: parsed?.canonical ?? null,
      text: [child.text, ...body].join("\n").trim(),
    });
  }
  return result;
}

function hasFigureChild(
  structured: StructuredDocument,
  parentId: string
): boolean {
  const parent = structured.nodes[parentId];
  if (!parent) return false;
  for (const childId of parent.childIds) {
    const child = structured.nodes[childId];
    if (child?.kind === "figure") return true;
    if (child && hasFigureChild(structured, child.id)) return true;
  }
  return false;
}

function paperIndexForPage(
  segmentation: PaperSegmentationResult,
  pageNumber: number
): number {
  for (const paper of segmentation.papers) {
    if (paper.pageNumbers.includes(pageNumber)) return paper.paperIndex;
  }
  return 1;
}

function summarizeTable(table: RawTable) {
  return {
    id: table.id,
    pageNumber: table.pageNumber,
    rows: table.rows,
    columns: table.columns,
    cells: table.cells.map((c) => ({
      row: c.row,
      column: c.column,
      text: c.text,
    })),
  };
}

function isInstructionLine(text: string): boolean {
  return /^(?:note|instructions?|attempt\b|all questions|use suitable|assume\b)/i.test(
    safeTrim(text)
  );
}

function ensureDiagramMarker(text: string): string {
  if (/\[DIAGRAM_PRESENT\]/i.test(text)) return text;
  return `${text}\n${DIAGRAM_PRESENT_MARKER}`.trim();
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
