import path from "path";

import {
  CMS_PENDING_PYQS_FILENAME,
  CMS_PENDING_SYLLABUS_FILENAME,
  CMS_PRODUCTION_PYQS_FILENAME,
  CMS_PRODUCTION_SYLLABUS_FILENAME,
  CMS_REVIEW_STATE_FILENAME,
  CMS_SAVE_REPORT_FILENAME,
} from "./constants";
import { diffPyqsJson, diffSyllabusJson } from "./diff-service";
import { readJobDiagramManifest } from "./writer-service";
import { getJob, updateJobStatus } from "./import-queue";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import type {
  ReviewDecision,
  ReviewPackage,
  ReviewRunSummary,
  ReviewSummary,
  SaveReport,
} from "./review-types";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
} from "./schema-types";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord, ImportStatus } from "./types";
import { readValidationReport } from "./validation-service";
import { getSubjectContentDir, readWriteReport } from "./writer-service";

export class ReviewProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ReviewProcessingError";
    this.code = code;
  }
}

export interface ReviewDecisionResult {
  job: ImportJobRecord;
  summary: ReviewRunSummary;
  review: ReviewSummary;
}

/**
 * Loads the full Review Center package for a job.
 */
export async function getReviewPackage(jobId: string): Promise<ReviewPackage> {
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new ReviewProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const jobDir = getJobDirectory(jobId);
  const contentDir =
    metadata.branch && metadata.semester && metadata.subjectCode
      ? getSubjectContentDir({
          branch: metadata.branch,
          semester: metadata.semester,
          subjectCode: metadata.subjectCode,
        })
      : null;

  const [
    pendingPyqs,
    pendingSyllabus,
    productionPyqs,
    productionSyllabus,
    existingPyqs,
    existingSyllabus,
    validationReport,
    writeReport,
    diagramManifest,
    saveReport,
    review,
    evidenceFile,
    evidenceValidation,
    academicDoc,
  ] = await Promise.all([
    readJsonFile(path.join(jobDir, CMS_PENDING_PYQS_FILENAME)),
    readJsonFile(path.join(jobDir, CMS_PENDING_SYLLABUS_FILENAME)),
    readJsonFile(path.join(jobDir, CMS_PRODUCTION_PYQS_FILENAME)),
    readJsonFile(path.join(jobDir, CMS_PRODUCTION_SYLLABUS_FILENAME)),
    contentDir
      ? readJsonFile(path.join(contentDir, "pyqs.json"))
      : Promise.resolve(null),
    contentDir
      ? readJsonFile(path.join(contentDir, "syllabus.json"))
      : Promise.resolve(null),
    readValidationReport(jobId),
    readWriteReport(jobId),
    readJobDiagramManifest(jobId),
    readJsonFile<SaveReport>(path.join(jobDir, CMS_SAVE_REPORT_FILENAME)),
    readJsonFile<ReviewSummary>(path.join(jobDir, CMS_REVIEW_STATE_FILENAME)),
    readJsonFile<{
      paperSegmentation?: {
        papers?: Array<{
          paperId: string;
          paperIndex: number;
          pageNumbers: number[];
          confidence: string;
          headerHints?: { subjectCode?: string | null };
          reasons?: string[];
        }>;
        status?: string;
      };
      questionCandidates?: Array<{
        provisionalId?: string;
        paperId?: string;
        questionNumber?: number | string | null;
        sourcePages?: number[];
        text?: string;
        hasDiagram?: boolean;
      }>;
      pages?: unknown[];
      warnings?: string[];
    }>(path.join(jobDir, "extraction-evidence.json")),
    readJsonFile<{ status?: string; errors?: string[]; warnings?: string[] }>(
      path.join(jobDir, "evidence-validation.json")
    ),
    readJsonFile<{
      papers?: Array<{
        paperId: string;
        paperIndex: number;
        sourcePages: number[];
        confidence: string;
        reviewRequired: boolean;
        warnings?: string[];
        metadata?: { subjectCode?: string | null };
        questions: Array<{
          id?: string;
          paperId?: string;
          questionNumber?: number | string | null;
          sourcePages?: number[];
          confidence?: string | number;
          hasDiagram?: boolean;
          validationStatus?: string | null;
          warnings?: string[];
          text?: string;
        }>;
      }>;
      questions?: Array<{
        id?: string;
        paperId?: string;
        questionNumber?: number | string | null;
        sourcePages?: number[];
        confidence?: string | number;
        hasDiagram?: boolean;
        validationStatus?: string | null;
        warnings?: string[];
        text?: string;
      }>;
      extractionStatus?: string;
    }>(path.join(jobDir, "academic-document.json")),
  ]);

  const effectivePendingPyqs = pendingPyqs ?? productionPyqs;
  const effectivePendingSyllabus = pendingSyllabus ?? productionSyllabus;

  const extractionEvidence = buildExtractionEvidenceSummary(
    evidenceFile,
    evidenceValidation,
    academicDoc
  );

  return {
    jobId,
    stage: metadata.stage,
    status: metadata.status,
    contentDir: contentDir ? toRepoRelative(contentDir) : null,
    existingPyqs,
    existingSyllabus,
    pendingPyqs: effectivePendingPyqs,
    pendingSyllabus: effectivePendingSyllabus,
    productionPyqs,
    productionSyllabus,
    validationReport,
    writeReport,
    diagramManifest,
    saveReport,
    pyqsDiff: diffPyqsJson(existingPyqs, effectivePendingPyqs),
    syllabusDiff: diffSyllabusJson(existingSyllabus, effectivePendingSyllabus),
    review,
    extractedMetadata: metadata.extractedMetadata ?? null,
    branch: metadata.branch,
    semester: metadata.semester,
    subjectCode: metadata.subjectCode,
    year: metadata.year,
    examSession: metadata.examSession,
    extractionEvidence,
  };
}

function buildExtractionEvidenceSummary(
  evidenceFile: {
    paperSegmentation?: {
      papers?: Array<{
        paperId: string;
        paperIndex: number;
        pageNumbers: number[];
        confidence: string;
        headerHints?: { subjectCode?: string | null };
        reasons?: string[];
      }>;
      status?: string;
    };
    questionCandidates?: Array<{
      provisionalId?: string;
      paperId?: string;
      questionNumber?: number | string | null;
      sourcePages?: number[];
      text?: string;
      hasDiagram?: boolean;
    }>;
    pages?: unknown[];
    warnings?: string[];
  } | null,
  evidenceValidation: {
    status?: string;
    errors?: string[];
    warnings?: string[];
  } | null,
  academicDoc: {
    papers?: Array<{
      paperId: string;
      paperIndex: number;
      sourcePages: number[];
      confidence: string;
      reviewRequired: boolean;
      warnings?: string[];
      metadata?: { subjectCode?: string | null };
      questions: Array<{
        id?: string;
        paperId?: string;
        questionNumber?: number | string | null;
        sourcePages?: number[];
        confidence?: string | number;
        hasDiagram?: boolean;
        validationStatus?: string | null;
        warnings?: string[];
        text?: string;
      }>;
    }>;
    questions?: Array<{
      id?: string;
      paperId?: string;
      questionNumber?: number | string | null;
      sourcePages?: number[];
      confidence?: string | number;
      hasDiagram?: boolean;
      validationStatus?: string | null;
      warnings?: string[];
      text?: string;
    }>;
    extractionStatus?: string;
  } | null
): ReviewPackage["extractionEvidence"] {
  if (!evidenceFile && !academicDoc && !evidenceValidation) {
    return null;
  }

  const confToNum = (c: string | number | undefined): number => {
    if (typeof c === "number") return c;
    if (c === "HIGH") return 0.9;
    if (c === "MEDIUM") return 0.65;
    if (c === "LOW") return 0.35;
    return 0.5;
  };

  const papers =
    academicDoc?.papers?.map((p) => ({
      paperId: p.paperId,
      paperIndex: p.paperIndex,
      sourcePages: p.sourcePages,
      confidence: confToNum(p.confidence),
      questionCount: p.questions.length,
      reviewRequired: p.reviewRequired,
      subjectCode: p.metadata?.subjectCode ?? null,
      warnings: p.warnings ?? [],
    })) ??
    evidenceFile?.paperSegmentation?.papers?.map((p) => ({
      paperId: p.paperId,
      paperIndex: p.paperIndex,
      sourcePages: p.pageNumbers,
      confidence: confToNum(p.confidence),
      questionCount: 0,
      reviewRequired: p.confidence === "LOW",
      subjectCode: p.headerHints?.subjectCode ?? null,
      warnings: p.reasons ?? [],
    })) ??
    [];

  const questions =
    academicDoc?.papers?.flatMap((p) =>
      p.questions.map((q, qi) => ({
        id: q.id ?? `${p.paperId}-q${qi + 1}`,
        paperId: q.paperId ?? p.paperId,
        questionNumber: q.questionNumber ?? null,
        sourcePages: q.sourcePages ?? p.sourcePages,
        confidence: confToNum(q.confidence),
        hasDiagram: Boolean(q.hasDiagram),
        validationStatus: q.validationStatus ?? null,
        warnings: q.warnings ?? [],
        textPreview: (q.text ?? "").slice(0, 160),
      }))
    ) ??
    academicDoc?.questions?.map((q, qi) => ({
      id: q.id ?? `q${qi + 1}`,
      paperId: q.paperId ?? "paper-1",
      questionNumber: q.questionNumber ?? null,
      sourcePages: q.sourcePages ?? [],
      confidence: confToNum(q.confidence),
      hasDiagram: Boolean(q.hasDiagram),
      validationStatus: q.validationStatus ?? null,
      warnings: q.warnings ?? [],
      textPreview: (q.text ?? "").slice(0, 160),
    })) ??
    evidenceFile?.questionCandidates?.map((q, qi) => ({
      id: q.provisionalId ?? `cand-${qi + 1}`,
      paperId: q.paperId ?? "paper-1",
      questionNumber: q.questionNumber ?? null,
      sourcePages: q.sourcePages ?? [],
      confidence: 0.5,
      hasDiagram: Boolean(q.hasDiagram),
      validationStatus: null,
      warnings: [] as string[],
      textPreview: (q.text ?? "").slice(0, 160),
    })) ??
    [];

  return {
    status:
      evidenceValidation?.status ??
      academicDoc?.extractionStatus ??
      evidenceFile?.paperSegmentation?.status ??
      null,
    paperCount: papers.length,
    questionCount: questions.length,
    pageCount: evidenceFile?.pages?.length ?? 0,
    warnings: [
      ...(evidenceValidation?.warnings ?? []),
      ...(evidenceFile?.warnings ?? []),
    ].slice(0, 40),
    errors: evidenceValidation?.errors ?? [],
    papers,
    questions: questions.slice(0, 80),
  };
}

/**
 * Opens Review Center for a written preview job.
 * Advances: WRITTEN → UNDER_REVIEW
 */
export async function startReviewForJob(
  jobId: string
): Promise<ReviewDecisionResult> {
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new ReviewProcessingError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const pipeline = await readPipelineState(jobId);
  const stage = pipeline?.stage ?? metadata.stage;

  if (
    stage !== PipelineStage.WRITTEN &&
    stage !== PipelineStage.REBUILT &&
    stage !== PipelineStage.UNDER_REVIEW &&
    stage !== PipelineStage.APPROVED
  ) {
    throw new ReviewProcessingError(
      "WRITTEN_REQUIRED",
      "Review requires WRITTEN or REBUILT preview first."
    );
  }

  const startedAt = new Date().toISOString();
  const pkg = await getReviewPackage(jobId);

  const review: ReviewSummary = {
    jobId,
    decision: null,
    decidedAt: null,
    note: null,
    editedPyqs: false,
    editedSyllabus: false,
    papersAdded: pkg.pyqsDiff.addedCount,
    questionsAdded: countPathKind(pkg.pyqsDiff.entries, "question"),
    modulesAdded: pkg.syllabusDiff.addedCount,
    topicsAdded: countPathKind(pkg.syllabusDiff.entries, "topic"),
    diagramPlans: pkg.writeReport?.diagrams.destinationFolders.length ?? 0,
  };

  await writeJsonAtomic(
    path.join(getJobDirectory(jobId), CMS_REVIEW_STATE_FILENAME),
    review
  );

  const summary: ReviewRunSummary = {
    startedAt,
    completedAt: null,
    decision: null,
    note: null,
    pyqsDiffCount: pkg.pyqsDiff.entries.length,
    syllabusDiffCount: pkg.syllabusDiff.entries.length,
  };

  await persistReviewState({
    jobId,
    stage: PipelineStage.UNDER_REVIEW,
    importStatus: "awaiting_review",
    summary,
  });

  const job = await requireJob(jobId);
  return {
    job: { ...job, stage: PipelineStage.UNDER_REVIEW, review: summary },
    summary,
    review,
  };
}

/**
 * Applies Approve / Reject / Request Changes.
 */
export async function submitReviewDecision(input: {
  jobId: string;
  decision: ReviewDecision;
  note?: string | null;
  editedPyqs?: ProductionPyqsJson | null;
  editedSyllabus?: ProductionSyllabusJson | null;
}): Promise<ReviewDecisionResult> {
  const metadata = await readJobMetadata(input.jobId);
  if (!metadata) {
    throw new ReviewProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${input.jobId}`
    );
  }

  const pipeline = await readPipelineState(input.jobId);
  const stage = pipeline?.stage ?? metadata.stage;

  if (
    stage !== PipelineStage.UNDER_REVIEW &&
    stage !== PipelineStage.WRITTEN &&
    stage !== PipelineStage.REBUILT &&
    stage !== PipelineStage.APPROVED
  ) {
    throw new ReviewProcessingError(
      "REVIEW_REQUIRED",
      "Submit a decision from UNDER_REVIEW."
    );
  }

  const jobDir = getJobDirectory(input.jobId);
  let editedPyqs = false;
  let editedSyllabus = false;

  if (input.editedPyqs) {
    await writeJsonAtomic(
      path.join(jobDir, CMS_PENDING_PYQS_FILENAME),
      input.editedPyqs
    );
    editedPyqs = true;
  }

  if (input.editedSyllabus) {
    await writeJsonAtomic(
      path.join(jobDir, CMS_PENDING_SYLLABUS_FILENAME),
      input.editedSyllabus
    );
    editedSyllabus = true;
  }

  const decidedAt = new Date().toISOString();
  const pkg = await getReviewPackage(input.jobId);

  const review: ReviewSummary = {
    jobId: input.jobId,
    decision: input.decision,
    decidedAt,
    note: input.note?.trim() || null,
    editedPyqs,
    editedSyllabus,
    papersAdded: pkg.pyqsDiff.addedCount,
    questionsAdded: countPathKind(pkg.pyqsDiff.entries, "question"),
    modulesAdded: pkg.syllabusDiff.addedCount,
    topicsAdded: countPathKind(pkg.syllabusDiff.entries, "topic"),
    diagramPlans: pkg.writeReport?.diagrams.destinationFolders.length ?? 0,
  };

  await writeJsonAtomic(path.join(jobDir, CMS_REVIEW_STATE_FILENAME), review);

  const summary: ReviewRunSummary = {
    startedAt: pipeline?.review?.startedAt ?? decidedAt,
    completedAt: decidedAt,
    decision: input.decision,
    note: review.note,
    pyqsDiffCount: pkg.pyqsDiff.entries.length,
    syllabusDiffCount: pkg.syllabusDiff.entries.length,
  };

  if (input.decision === "approve") {
    await persistReviewState({
      jobId: input.jobId,
      stage: PipelineStage.APPROVED,
      importStatus: "approved",
      summary,
    });
  } else if (input.decision === "reject") {
    await persistReviewState({
      jobId: input.jobId,
      stage: PipelineStage.WRITTEN,
      importStatus: "rejected",
      summary,
    });
  } else {
    await persistReviewState({
      jobId: input.jobId,
      stage: PipelineStage.UNDER_REVIEW,
      importStatus: "awaiting_review",
      summary,
    });
  }

  const job = await requireJob(input.jobId);
  return {
    job: {
      ...job,
      review: summary,
    },
    summary,
    review,
  };
}

async function persistReviewState(input: {
  jobId: string;
  stage: PipelineStage;
  importStatus: ImportStatus;
  summary: ReviewRunSummary;
}): Promise<void> {
  const now = new Date().toISOString();

  // Keep queue entry as queued while under review; mark completed only after save.
  await updateJobStatus(input.jobId, "queued", {
    stage: input.stage,
    error: null,
  });

  const metadata = await readJobMetadata(input.jobId);
  if (metadata) {
    await updateJobMetadata({
      ...metadata,
      stage: input.stage,
      status: input.importStatus,
      updatedAt: now,
      error: null,
    });
  }

  const pipeline = await readPipelineState(input.jobId);
  if (pipeline) {
    await updatePipelineState({
      ...pipeline,
      stage: input.stage,
      status: input.importStatus,
      updatedAt: now,
      error: null,
      review: input.summary,
    });
  }
}

async function requireJob(jobId: string): Promise<ImportJobRecord> {
  const job = await getJob(jobId);
  if (!job) {
    throw new ReviewProcessingError(
      "JOB_HYDRATION_FAILED",
      "Review finished but the job could not be reloaded."
    );
  }
  return job;
}

function countPathKind(
  entries: { path: string; kind: string }[],
  needle: string
): number {
  return entries.filter(
    (entry) =>
      entry.kind === "added" &&
      entry.path.toLowerCase().includes(needle.toLowerCase())
  ).length;
}

function toRepoRelative(absolutePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = absolutePath.replace(/\\/g, "/");
  if (normalized.startsWith(cwd + "/")) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}
