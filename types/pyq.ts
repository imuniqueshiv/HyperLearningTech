/**
 * Supported attachment types today. Extend this union as new renderers are added.
 */
export type QuestionAttachmentType = "image";

/**
 * Future attachment types will extend QuestionAttachmentType.
 * Unsupported types are skipped at render time with a dev-only warning.
 */
export interface QuestionAttachment {
  id: string;
  type: QuestionAttachmentType;
  path: string;
  title: string;
  alt: string;
  caption: string;
  aiContext: string;
}

export interface SubQuestion {
  id: string;
  label: string;
  text: string;
  latex?: string;
  unit: string;
  type?: string;
  attachments?: QuestionAttachment[];
}

export interface Question {
  id: string;
  questionNumber: string;
  subQuestions: SubQuestion[];
}

export interface Paper {
  exam: string;
  year: number;
  month: string;
  questions: Question[];
}

export interface PYQData {
  papers: Paper[];
}
