/**
 * Phase 2: Validate AI structuring output against OCR/layout evidence.
 * AI cannot silently invent or change numerical values.
 */

import type { AcademicDocument } from "./academic-document";
import type {
  AcademicPaper,
  AcademicQuestion,
  AcademicQuestionType,
} from "./academic-types";
import type { ExtractionEvidence } from "./extraction-evidence";
import {
  extractNumericalTokens,
  normalizeNumericToken,
} from "./question-number";
import { findSuspiciousNumericEdits } from "./ocr-confusion";
import {
  validateTableNumericsAgainstText,
  validateTableStructure,
} from "./table-validator";
import { safeTrim } from "./string-normalize";

export type EvidenceValidationStatus = "VALID" | "REVIEW_REQUIRED" | "INVALID";

export interface EvidenceValidationResult {
  status: EvidenceValidationStatus;
  errors: string[];
  warnings: string[];
}

/**
 * Compares AcademicDocument text against ExtractionEvidence tokens.
 */
export function validateAgainstEvidence(
  academic: AcademicDocument,
  evidence: ExtractionEvidence
): EvidenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [...evidence.warnings];

  const evidenceNums = new Set(
    evidence.numericalTokens
      .map(normalizeNumericToken)
      .filter((t): t is string => Boolean(t))
  );

  const allQuestions = flattenQuestions(academic);
  const aiTexts: string[] = [];
  for (const q of allQuestions) {
    for (const sub of q.subQuestions) {
      aiTexts.push(sub.text);
      if (sub.latex) aiTexts.push(sub.latex);
    }
  }
  const aiJoined = aiTexts.join("\n");
  const aiNums = extractNumericalTokens(aiJoined).map(
    (t) => normalizeNumericToken(t)!
  );

  for (const token of aiNums) {
    if (!token) continue;
    if (evidenceNums.has(token)) continue;
    if (evidenceNums.size === 0) {
      warnings.push(`AI_NUMBER_UNVERIFIED:${token}`);
      continue;
    }
    if (/^\d{1,4}$/.test(token) || /^\d+\.\d+$/.test(token)) {
      errors.push(`AI_NUMBER_NOT_IN_EVIDENCE:${token}`);
    } else {
      warnings.push(`AI_NUMBER_NOT_IN_EVIDENCE:${token}`);
    }
  }

  for (const hit of findSuspiciousNumericEdits(
    [...evidenceNums],
    aiNums.filter(Boolean)
  )) {
    warnings.push(hit);
  }

  for (const table of evidence.tables) {
    const tv = validateTableStructure(table);
    warnings.push(...tv.warnings);
    errors.push(...tv.errors);
    if (aiJoined.trim()) {
      warnings.push(...validateTableNumericsAgainstText(table, aiJoined));
    }
  }

  for (const candidate of evidence.questionCandidates) {
    for (const token of candidate.numericalTokens) {
      const norm = normalizeNumericToken(token);
      if (!norm) continue;
      if (!aiJoined.includes(token) && !aiNums.includes(norm)) {
        if (candidate.numericalTokens.length <= 12) {
          warnings.push(
            `EVIDENCE_NUMBER_MISSING_IN_AI:${norm}:${candidate.provisionalId}`
          );
        }
      }
    }
  }

  if (evidence.questionCandidates.some((q) => q.questionNumber == null)) {
    warnings.push("UNNUMBERED_QUESTIONS_PRESENT");
  }

  if (
    evidence.paperSegmentation.reviewRequired ||
    evidence.paperSegmentation.status === "REVIEW_REQUIRED"
  ) {
    warnings.push("PAPER_SEGMENTATION_REVIEW_REQUIRED");
  }
  if (evidence.paperSegmentation.status === "INVALID") {
    errors.push("PAPER_SEGMENTATION_INVALID");
  }

  if (allQuestions.length === 0 && evidence.questionCandidates.length > 0) {
    errors.push("AI_DROPPED_ALL_QUESTIONS");
  }

  // Adversarial: AI inventing extra question numbers
  const evidenceQ = new Set(
    evidence.questionCandidates
      .map((q) => q.questionNumber)
      .filter((n): n is string => Boolean(n))
  );
  for (const q of allQuestions) {
    if (
      evidenceQ.size > 0 &&
      q.questionNumber &&
      !evidenceQ.has(q.questionNumber) &&
      !/^Q\.\?/.test(q.questionNumber)
    ) {
      // Allow if same index exists in evidence under different formatting
      const idx = q.questionNumber.match(/(\d+)/)?.[1];
      const found = [...evidenceQ].some((e) => e.includes(String(idx)));
      if (!found) {
        warnings.push(`AI_QUESTION_NUMBER_NOT_IN_EVIDENCE:${q.questionNumber}`);
      }
    }
  }

  let status: EvidenceValidationStatus = "VALID";
  if (errors.length > 0) {
    status = "INVALID";
  } else if (warnings.length > 0) {
    status = "REVIEW_REQUIRED";
  }

  return { status, errors, warnings };
}

/**
 * Ensures AcademicDocument.papers is populated from evidence when Gemini
 * returned a flat questions list.
 */
export function ensurePapersOnAcademicDocument(
  academic: AcademicDocument,
  evidence: ExtractionEvidence
): AcademicDocument {
  if (academic.papers && academic.papers.length > 0) {
    const papers = academic.papers.map((paper) => {
      const numbers = paper.questions
        .map((q) => safeTrim(q.questionNumber))
        .filter(Boolean);
      const seen = new Set<string>();
      const hasDuplicateNumber = numbers.some((n) => {
        if (seen.has(n)) return true;
        seen.add(n);
        return false;
      });
      if (!hasDuplicateNumber) {
        return paper;
      }
      return {
        ...paper,
        reviewRequired: true,
        warnings: [...paper.warnings, "DUPLICATE_QUESTION_NUMBER_FROM_AI"],
      };
    });
    return {
      ...academic,
      papers,
      questions: papers.flatMap((p) => p.questions),
      extractionStatus:
        papers.some((p) => p.reviewRequired) ||
        academic.extractionStatus === "REVIEW_REQUIRED" ||
        evidence.paperSegmentation.reviewRequired
          ? "REVIEW_REQUIRED"
          : (academic.extractionStatus ?? "VALID"),
      extractionWarnings: [
        ...(academic.extractionWarnings ?? []),
        ...papers
          .filter((p) =>
            p.warnings.includes("DUPLICATE_QUESTION_NUMBER_FROM_AI")
          )
          .map(() => "DUPLICATE_QUESTION_NUMBER_FROM_AI"),
      ],
    };
  }

  const fromEvidence = academicFromEvidence(evidence, {
    metadata: academic.metadata,
    exam: academic.exam,
    diagrams: academic.diagrams,
    usage: academic.usage,
  });

  // Prefer Gemini question texts when paper identity is present.
  // Never assign the same flat Q.1 to every paper when paperIndex is missing.
  const assigned = new Set<string>();
  const papers = fromEvidence.papers!.map((paper) => {
    const byPaperId = academic.questions.filter(
      (q) => q.paperId === paper.paperId || q.paperIndex === paper.paperIndex
    );
    if (byPaperId.length > 0) {
      for (const q of byPaperId) assigned.add(q.id);
      return {
        ...paper,
        questions: byPaperId.map((q) => ({
          ...q,
          paperId: paper.paperId,
          paperIndex: paper.paperIndex,
          sourcePages: q.sourcePages ?? paper.sourcePages,
        })),
      };
    }

    // Single-paper import: overlay Gemini texts onto the sole paper shell.
    if ((fromEvidence.papers?.length ?? 0) === 1) {
      return {
        ...paper,
        questions:
          academic.questions.length > 0
            ? academic.questions.map((q) => ({
                ...q,
                paperId: paper.paperId,
                paperIndex: paper.paperIndex,
                sourcePages: q.sourcePages ?? paper.sourcePages,
              }))
            : paper.questions,
      };
    }

    // Multi-paper without paper identity on AI questions: keep evidence structure.
    return paper;
  });

  const unassigned = academic.questions.filter((q) => !assigned.has(q.id));
  if (unassigned.length > 0 && papers.length > 1) {
    // Surface for review rather than inventing paper ownership.
    for (const paper of papers) {
      paper.warnings = [...paper.warnings, "AI_QUESTIONS_LACK_PAPER_ID"];
      paper.reviewRequired = true;
    }
  }

  return {
    ...academic,
    papers,
    questions: papers.flatMap((p) => p.questions),
    extractionStatus:
      papers.some((p) => p.reviewRequired) ||
      fromEvidence.extractionStatus === "REVIEW_REQUIRED"
        ? "REVIEW_REQUIRED"
        : fromEvidence.extractionStatus,
    extractionWarnings: [
      ...(academic.extractionWarnings ?? []),
      ...evidence.warnings,
      ...(unassigned.length > 0 && papers.length > 1
        ? ["AI_QUESTIONS_LACK_PAPER_ID"]
        : []),
    ],
  };
}

function flattenQuestions(academic: AcademicDocument): AcademicQuestion[] {
  if (academic.papers && academic.papers.length > 0) {
    return academic.papers.flatMap((p) => p.questions);
  }
  return academic.questions;
}

/**
 * Deterministic fallback: build a paper-aware AcademicDocument from evidence.
 */
export function academicFromEvidence(
  evidence: ExtractionEvidence,
  base: Pick<AcademicDocument, "metadata"> &
    Partial<Pick<AcademicDocument, "exam" | "diagrams" | "usage">>
): AcademicDocument {
  const papers: AcademicPaper[] = evidence.paperSegmentation.papers.map(
    (seg) => {
      const cands = evidence.questionCandidates.filter(
        (q) => q.paperIndex === seg.paperIndex
      );
      const questions = cands.map((cand, index) =>
        candidateToQuestion(cand, index)
      );
      return {
        paperId: seg.paperId,
        paperIndex: seg.paperIndex,
        sourcePages: [...seg.pageNumbers],
        exam: {
          exam: seg.headerHints.examSession
            ? `${seg.headerHints.examSession}${seg.headerHints.year ? ` ${seg.headerHints.year}` : ""}`
            : (base.exam?.exam ?? null),
          year: seg.headerHints.year ?? base.exam?.year ?? null,
          month: seg.headerHints.examSession ?? base.exam?.month ?? null,
          maxMarks: base.exam?.maxMarks ?? null,
          time: base.exam?.time ?? null,
          commonInstructions: evidence.instructions,
          isPredicted: null,
          gradingSystem: base.exam?.gradingSystem ?? null,
        },
        instructions: evidence.instructions,
        questions,
        confidence: seg.confidence,
        warnings: seg.reasons.filter((r) => r.includes("fallback")),
        reviewRequired:
          seg.confidence === "LOW" || evidence.paperSegmentation.reviewRequired,
        metadata: {
          subjectCode: seg.headerHints.subjectCode,
          university: null,
        },
      };
    }
  );

  // Ensure at least one paper shell
  if (papers.length === 0) {
    papers.push({
      paperId: "paper-1",
      paperIndex: 1,
      sourcePages: [],
      exam: base.exam ?? null,
      instructions: evidence.instructions,
      questions: evidence.questionCandidates.map((c, i) =>
        candidateToQuestion(c, i)
      ),
      confidence: "LOW",
      warnings: ["NO_SEGMENTS"],
      reviewRequired: true,
    });
  }

  const flatQuestions = papers.flatMap((p) => p.questions);
  const status =
    evidence.paperSegmentation.status === "INVALID"
      ? "INVALID"
      : evidence.paperSegmentation.reviewRequired ||
          evidence.warnings.length > 0
        ? "REVIEW_REQUIRED"
        : "VALID";

  return {
    version: 1,
    metadata: {
      ...base.metadata,
      detector: "evidence-fallback-v1",
    },
    exam: base.exam ?? papers[0]?.exam ?? null,
    units: [],
    topics: [],
    questions: flatQuestions,
    papers,
    diagrams: base.diagrams ?? [],
    usage: base.usage ?? null,
    extractionStatus: status,
    extractionWarnings: evidence.warnings,
  };
}

function candidateToQuestion(
  cand: ExtractionEvidence["questionCandidates"][number],
  index: number
): AcademicQuestion {
  const qNum = cand.questionNumber ?? `Q.?${index + 1}`;
  const questionType: AcademicQuestionType = cand.hasDiagram
    ? "diagram"
    : "unknown";
  const subs =
    cand.subQuestions.length > 0
      ? cand.subQuestions.map((sub, sIdx) => ({
          id: `${cand.provisionalId}-s${sIdx + 1}`,
          label: sub.label ?? "",
          text: cand.hasDiagram ? ensureMarker(sub.text) : sub.text,
          latex: null,
          unit: null,
          type: null,
          marks: null,
          difficulty: null,
          questionType,
          attachments: [],
        }))
      : [
          {
            id: `${cand.provisionalId}-s1`,
            label: "",
            text: cand.hasDiagram ? ensureMarker(cand.text) : cand.text,
            latex: null,
            unit: null,
            type: null,
            marks: null,
            difficulty: null,
            questionType,
            attachments: [],
          },
        ];

  return {
    id: cand.provisionalId,
    questionNumber: qNum.startsWith("Q.") ? qNum : `Q.${index + 1}`,
    marks: null,
    subQuestions: subs,
    paperId: cand.paperId,
    paperIndex: cand.paperIndex,
    sourcePages: [...cand.sourcePages],
    warnings: cand.questionNumber == null ? ["UNNUMBERED"] : [],
  };
}

function ensureMarker(text: string): string {
  if (/\[DIAGRAM_PRESENT\]/i.test(text)) return text;
  return `${text}\n[DIAGRAM_PRESENT]`.trim();
}
