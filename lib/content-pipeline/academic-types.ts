/**
 * Intermediate academic models for Gemini structuring (Phase 7).
 * These are NOT production pyqs.json / syllabus.json — Writer owns that.
 */

export type AcademicQuestionType =
  | "numerical"
  | "theory"
  | "diagram"
  | "mixed"
  | "unknown";

export type AcademicDifficulty = "easy" | "medium" | "hard" | "unknown";

export interface AcademicMetadata {
  jobId: string;
  jobType: "syllabus" | "pyq" | "diagram" | "bulk";
  sourceFilename: string;
  subjectCode: string | null;
  subjectName: string | null;
  subjectTitle: string | null;
  branch: string | null;
  semester: string | null;
  university: string | null;
  structuredAt: string;
  model: string;
  detector: string;
}

export interface AcademicExam {
  /** e.g. "December 2025" */
  exam: string | null;
  year: number | null;
  month: string | null;
  maxMarks: number | null;
  time: string | null;
  commonInstructions: string[];
  isPredicted: boolean | null;
  gradingSystem: string | null;
}

export interface AcademicUnit {
  id: string;
  number: number | null;
  title: string;
  hours: number | null;
  topicIds: string[];
}

export interface AcademicTopic {
  id: string;
  unitId: string | null;
  slug: string;
  title: string;
  displayOrder: number;
}

/**
 * Attachment fields aligned with production QuestionAttachment,
 * but `sourcePath` remains job-workspace relative until Writer.
 */
export interface AcademicAttachment {
  id: string;
  type: "image";
  /** Job-relative WEBP from Phase 6, e.g. diagrams/page-1/Q.1-a.webp */
  sourcePath: string;
  title: string;
  alt: string;
  caption: string;
  aiContext: string;
  category: string | null;
}

export interface AcademicSubQuestion {
  id: string;
  label: string;
  text: string;
  latex: string | null;
  /** e.g. "Unit 1" — Writer maps to SubQuestion.unit */
  unit: string | null;
  /** Topic slug — Writer maps to SubQuestion.type */
  type: string | null;
  marks: number | null;
  difficulty: AcademicDifficulty | null;
  questionType: AcademicQuestionType | null;
  attachments: AcademicAttachment[];
}

export interface AcademicQuestion {
  id: string;
  /** e.g. "Q.1" */
  questionNumber: string;
  marks: number | null;
  subQuestions: AcademicSubQuestion[];
  /** Phase 2: owning paper identity (1-based index as paper-1). */
  paperId?: string;
  paperIndex?: number;
  sourcePages?: number[];
  warnings?: string[];
}

/**
 * Phase 2: one logical exam paper inside an Import Session.
 */
export interface AcademicPaper {
  paperId: string;
  paperIndex: number;
  sourcePages: number[];
  exam: AcademicExam | null;
  instructions: string[];
  questions: AcademicQuestion[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
  /** When true, Local Save must not proceed without explicit review. */
  reviewRequired: boolean;
  /** Optional subject metadata hints from segmentation. */
  metadata?: {
    subjectCode?: string | null;
    university?: string | null;
  };
}

export interface AcademicDiagram {
  id: string;
  /** Job-relative WEBP from Phase 6 — do not move. */
  sourcePath: string;
  filename: string;
  pageNumber: number;
  relatedQuestionId: string | null;
  relatedSubQuestionId: string | null;
  title: string;
  alt: string;
  caption: string;
  aiContext: string;
  category: string | null;
  width: number;
  height: number;
}

export interface AcademicTokenUsage {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}
