import type {
  AcademicDiagram,
  AcademicExam,
  AcademicMetadata,
  AcademicQuestion,
  AcademicTokenUsage,
  AcademicTopic,
  AcademicUnit,
} from "./academic-types";

/**
 * Intermediate Gemini structuring output.
 * Saved as academic-document.json — never written to content/.
 */
export interface AcademicDocument {
  version: 1;
  metadata: AcademicMetadata;
  exam: AcademicExam | null;
  units: AcademicUnit[];
  topics: AcademicTopic[];
  questions: AcademicQuestion[];
  diagrams: AcademicDiagram[];
  usage: AcademicTokenUsage | null;
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
