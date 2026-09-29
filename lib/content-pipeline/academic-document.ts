import type {
  AcademicDiagram,
  AcademicExam,
  AcademicMetadata,
  AcademicPaper,
  AcademicQuestion,
  AcademicTokenUsage,
  AcademicTopic,
  AcademicUnit,
} from "./academic-types";

/**
 * Intermediate Gemini structuring output.
 * Saved as academic-document.json — never written to content/.
 *
 * Phase 2: `papers` is authoritative for multi-paper imports.
 * `questions` remains a flat compatibility view (all papers concatenated).
 */
export interface AcademicDocument {
  version: 1;
  metadata: AcademicMetadata;
  exam: AcademicExam | null;
  units: AcademicUnit[];
  topics: AcademicTopic[];
  questions: AcademicQuestion[];
  /** Present for Phase 2 multi-paper aware documents. */
  papers?: AcademicPaper[];
  diagrams: AcademicDiagram[];
  usage: AcademicTokenUsage | null;
  /** Aggregate extraction status for save gating. */
  extractionStatus?: "VALID" | "REVIEW_REQUIRED" | "INVALID";
  extractionWarnings?: string[];
}

/** Summary stored on pipeline state for the admin dashboard. */
export interface StructuringRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  model: string;
  questionCount: number;
  subQuestionCount: number;
  unitCount: number;
  topicCount: number;
  diagramCount: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  academicDocumentPath: string;
}
