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

export interface SubjectInfo {
  code: string;
  name: string;
  type: SubjectType;
}

export interface PromptContext {
  question: string;
  subjectCode: string;
  subjectType: SubjectType;
}

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
