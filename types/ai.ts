// =========================
// PYQ AI
// =========================

export interface AIRequest {
  question: string;
  subjectCode: string;
  forceRefresh?: boolean;
}

export interface AIResponse {
  success: boolean;
  answer?: string;
  cached?: boolean;
  error?: string;
}

// =========================
// Subject
// =========================

export type SubjectType =
  | "MATH"
  | "COMPUTER"
  | "CHEMISTRY"
  | "PHYSICS"
  | "ENGLISH"
  | "ELECTRICAL"
  | "MECHANICAL"
  | "CIVIL"
  | "GRAPHICS"
  | "GENERAL";

export interface SubjectInfo {
  code: string;
  name: string;
  type: SubjectType;
}

// =========================
// PYQ Prompt Builder
// =========================

export interface PromptContext {
  question: string;
  subjectCode: string;
  subjectType: SubjectType;
}

// =========================
// Hyper AI Workspace
// =========================

export type WorkspaceAction =
  | "EXPLAIN"
  | "NOTES"
  | "ANSWER_5"
  | "ANSWER_7"
  | "REVISION"
  | "MCQ"
  | "PYQ"
  | "FORMULA";

export interface WorkspaceRequest {
  topicId: string;
  subjectCode: string;
  action: WorkspaceAction;
  forceRefresh?: boolean;
}

export interface WorkspaceResponse {
  success: boolean;
  answer?: string;
  cached?: boolean;
  action?: WorkspaceAction;
  relatedTopics?: string[];
  error?: string;
}

export interface WorkspacePromptContext {
  action: WorkspaceAction;

  subjectCode: string;

  subjectName: string;

  subjectType: SubjectType;

  module: string;

  topic: string;
}

export interface WorkspaceGenerateInput {
  subjectCode: string;
  module: string;
  topic: string;
  action: WorkspaceAction;
  forceRefresh?: boolean;
}

export interface WorkspaceGenerateResult {
  answer: string;
  cached: boolean;
}
