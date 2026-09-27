/**
 * Production JSON shapes matching content pyqs.json and syllabus.json.
 * Preview artifacts only — Writer copies these later.
 */

export interface ProductionPyqSubject {
  id: string;
  code: string;
  name: string;
  title: string;
  semester: string;
  gradingSystem: string;
  maxMarks: number;
  time: string;
  commonInstructions: string[];
}

export interface ProductionQuestionAttachment {
  id: string;
  type: "image";
  /** Temporary job-workspace path until Writer relocates. */
  path: string;
  title: string;
  alt: string;
  caption: string;
  aiContext: string;
}

export interface ProductionSubQuestion {
  id: string;
  label: string;
  text: string;
  latex?: string;
  unit: string;
  type?: string;
  isPredicted?: boolean;
  attachments?: ProductionQuestionAttachment[];
}

export interface ProductionQuestion {
  id: string;
  questionNumber: string;
  subQuestions: ProductionSubQuestion[];
}

export interface ProductionPaper {
  exam: string;
  year: number;
  month: string;
  isPredicted?: boolean;
  questions: ProductionQuestion[];
}

export interface ProductionPyqsJson {
  subject: ProductionPyqSubject;
  papers: ProductionPaper[];
}

export interface ProductionSyllabusSubject {
  id: string;
  code: string;
  name: string;
  title: string;
  university: string;
  scheme: string;
  semester: string;
  credits: number;
  lectureTutorialPractical: string;
  commonTo: string;
}

export interface ProductionTopic {
  id: string;
  slug: string;
  title: string;
  displayOrder: number;
}

export interface ProductionSyllabusModule {
  id: string;
  number: number;
  title: string;
  hours: number;
  topics: ProductionTopic[];
  questionIds: string[];
  predictedQuestionIds: string[];
}

export interface ProductionSyllabusJson {
  subject: ProductionSyllabusSubject;
  modules: ProductionSyllabusModule[];
}

export interface SchemaBuildResult {
  pyqs: ProductionPyqsJson | null;
  syllabus: ProductionSyllabusJson | null;
  questionCount: number;
  subQuestionCount: number;
  moduleCount: number;
  topicCount: number;
  diagramCount: number;
}

export interface SchemaBuildRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  questionCount: number;
  subQuestionCount: number;
  moduleCount: number;
  topicCount: number;
  diagramCount: number;
  pyqsPath: string | null;
  syllabusPath: string | null;
}

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface ValidationStatistics {
  questionCount: number;
  subQuestionCount: number;
  moduleCount: number;
  topicCount: number;
  diagramCount: number;
  attachmentCount: number;
  errorCount: number;
  warningCount: number;
}

export interface ValidationReport {
  status: "PASS" | "FAILED";
  validatedAt: string;
  durationMs: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  statistics: ValidationStatistics;
  pyqsPath: string | null;
  syllabusPath: string | null;
}

export interface ValidationRunSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "PASS" | "FAILED";
  errorCount: number;
  warningCount: number;
  questionCount: number;
  moduleCount: number;
  topicCount: number;
  diagramCount: number;
  reportPath: string;
}
