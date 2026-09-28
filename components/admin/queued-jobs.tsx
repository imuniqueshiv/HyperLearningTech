"use client";

import { useState } from "react";
import {
  Brain,
  FileJson,
  ImageIcon,
  LayoutGrid,
  Loader2,
  PenLine,
  ScanText,
  ShieldCheck,
} from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  DiagramManifest,
  DiagramRunSummary,
  ImportJobRecord,
  LayoutRunSummary,
  OcrRunSummary,
  SchemaBuildRunSummary,
  StructuringRunSummary,
  ValidationReport,
  ValidationRunSummary,
  WriteReport,
  WritingRunSummary,
} from "@/lib/content-pipeline";
import {
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PIPELINE_STAGE_LABELS,
  PipelineStage,
  formatFileSize,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface QueuedJobsProps {
  jobs: ImportJobRecord[];
  loading?: boolean;
  onRefresh?: () => void;
  onJobUpdated?: (job: ImportJobRecord) => void;
}

type DetailPanel =
  | { kind: "ocr"; jobId: string; summary: OcrRunSummary }
  | { kind: "layout"; jobId: string; summary: LayoutRunSummary }
  | { kind: "diagrams"; jobId: string; summary: DiagramRunSummary }
  | { kind: "structuring"; jobId: string; summary: StructuringRunSummary }
  | { kind: "schema"; jobId: string; summary: SchemaBuildRunSummary }
  | {
      kind: "validation";
      jobId: string;
      summary: ValidationRunSummary;
      report: ValidationReport;
    }
  | {
      kind: "writing";
      jobId: string;
      summary: WritingRunSummary;
      report: WriteReport;
      manifest: DiagramManifest | null;
    };

type RunningAction =
  | "ocr"
  | "layout"
  | "diagrams"
  | "structuring"
  | "schema"
  | "validation"
  | "writing";

function statusClass(status: ImportJobRecord["status"]): string {
  switch (status) {
    case "queued":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "processing":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400";
    case "completed":
    case "approved":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "failed":
    case "rejected":
    case "cancelled":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function canRunOcr(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.QUEUED ||
    job.stage === PipelineStage.UPLOADED ||
    job.stage === PipelineStage.FAILED ||
    job.stage === PipelineStage.OCR_COMPLETED
  );
}

function canRunLayout(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.OCR_COMPLETED ||
    job.stage === PipelineStage.LAYOUT_COMPLETED ||
    (job.stage === PipelineStage.FAILED && Boolean(job.ocr))
  );
}

function canRunDiagrams(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.LAYOUT_COMPLETED ||
    job.stage === PipelineStage.DIAGRAMS_READY ||
    (job.stage === PipelineStage.FAILED && Boolean(job.layout))
  );
}

function canRunStructuring(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.DIAGRAMS_READY ||
    job.stage === PipelineStage.STRUCTURED ||
    (job.stage === PipelineStage.FAILED && Boolean(job.diagrams))
  );
}

function canRunSchema(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.STRUCTURED ||
    job.stage === PipelineStage.SCHEMA_READY ||
    job.stage === PipelineStage.VALIDATED ||
    (job.stage === PipelineStage.FAILED && Boolean(job.structuring))
  );
}

function canRunValidation(job: ImportJobRecord): boolean {
  return (
    job.stage === PipelineStage.SCHEMA_READY ||
    job.stage === PipelineStage.VALIDATED ||
    (job.stage === PipelineStage.FAILED && Boolean(job.schema))
  );
}

function canRunWriter(job: ImportJobRecord): boolean {
  return (
    (job.stage === PipelineStage.VALIDATED &&
      job.validation?.status === "PASS") ||
    job.stage === PipelineStage.DIAGRAMS_WRITTEN ||
    job.stage === PipelineStage.WRITTEN ||
    (job.stage === PipelineStage.FAILED && job.validation?.status === "PASS")
  );
}

function diagramPreviewUrl(jobId: string, relativePath: string): string {
  return `${API_ENDPOINTS.CMS_DIAGRAMS}/${encodeURIComponent(jobId)}?path=${encodeURIComponent(relativePath)}`;
}

export function QueuedJobs({
  jobs,
  loading = false,
  onRefresh,
}: QueuedJobsProps) {
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<RunningAction | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailPanel | null>(
    null
  );
  const [schemaPreview, setSchemaPreview] = useState<{
    pyqs: unknown;
    syllabus: unknown;
  } | null>(null);
  const [schemaPreviewLoading, setSchemaPreviewLoading] = useState(false);

  async function openSchemaDetail(
    jobId: string,
    summary: SchemaBuildRunSummary
  ) {
    setSelectedDetail({ kind: "schema", jobId, summary });
    setSchemaPreview(null);
    setSchemaPreviewLoading(true);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.CMS_SCHEMA}/${encodeURIComponent(jobId)}`
      );
      const data = (await response.json()) as {
        success: boolean;
        preview?: { pyqs: unknown; syllabus: unknown };
      };
      if (data.success && data.preview) {
        setSchemaPreview(data.preview);
      }
    } catch {
      setSchemaPreview(null);
    } finally {
      setSchemaPreviewLoading(false);
    }
  }

  const queuedCount = jobs.filter((job) => job.status === "queued").length;

  async function runOcr(jobId: string) {
    await runSupervisorAction(jobId, "start");
  }

  async function runSupervisorAction(
    jobId: string,
    action: "start" | "resume" | "retry" | "cancel"
  ) {
    setRunningJobId(jobId);
    setRunningAction(
      action === "start"
        ? "ocr"
        : action === "resume" || action === "retry"
          ? "layout"
          : "ocr"
    );
    setActionError(null);

    try {
      const response = await fetch(API_ENDPOINTS.CMS_RECOVERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Pipeline control failed.");
      }

      onRefresh?.();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Pipeline control failed."
      );
    } finally {
      setRunningJobId(null);
      setRunningAction(null);
    }
  }

  async function runLayout(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  async function runDiagrams(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  async function runStructuring(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  async function runSchema(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  async function runValidation(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  async function runWriter(jobId: string) {
    await runSupervisorAction(jobId, "resume");
  }

  return (
    <section
      id="queued-jobs"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Queued Jobs</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Local import queue ({queuedCount} waiting)
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex w-fit items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </header>

      {actionError && (
        <p className="border-b border-border px-5 py-3 text-sm text-red-600 dark:text-red-400">
          {actionError}
        </p>
      )}

      {loading && jobs.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          Loading queue…
        </p>
      ) : jobs.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No jobs in the import queue yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1920px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Job ID</th>
                <th className="px-5 py-3 font-medium">Status / Stage</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Semester</th>
                <th className="px-5 py-3 font-medium">File type</th>
                <th className="px-5 py-3 font-medium">OCR</th>
                <th className="px-5 py-3 font-medium">Layout</th>
                <th className="px-5 py-3 font-medium">Diagrams</th>
                <th className="px-5 py-3 font-medium">Structuring</th>
                <th className="px-5 py-3 font-medium">Schema</th>
                <th className="px-5 py-3 font-medium">Validation</th>
                <th className="px-5 py-3 font-medium">Writer</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const ocr = job.ocr;
                const layout = job.layout;
                const diagrams = job.diagrams;
                const structuring = job.structuring;
                const schema = job.schema;
                const validation = job.validation;
                const writing = job.writing;
                const isRunning = runningJobId === job.id;
                const isOcrRunning = isRunning && runningAction === "ocr";
                const isLayoutRunning = isRunning && runningAction === "layout";
                const isDiagramsRunning =
                  isRunning && runningAction === "diagrams";
                const isStructuringRunning =
                  isRunning && runningAction === "structuring";
                const isSchemaRunning = isRunning && runningAction === "schema";
                const isValidationRunning =
                  isRunning && runningAction === "validation";
                const isWriterRunning =
                  isRunning && runningAction === "writing";

                return (
                  <tr key={job.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-foreground">
                        {job.id}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {job.originalFilename} · {JOB_TYPE_LABELS[job.type]}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          statusClass(job.status)
                        )}
                      >
                        {IMPORT_STATUS_LABELS[job.status]}
                      </span>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {PIPELINE_STAGE_LABELS[job.stage]}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {job.subjectCode ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {job.branch ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {job.semester ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <div>{job.mimeType}</div>
                      <div className="text-xs">
                        {formatFileSize(job.fileSize)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {ocr ? (
                        <div className="space-y-0.5">
                          <div>Pages: {ocr.pageCount}</div>
                          <div>Images: {ocr.imageCount}</div>
                          <div>Tables: {ocr.tableCount}</div>
                          <div>{ocr.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.OCR_PROCESSING ? (
                        "OCR started…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {layout ? (
                        <div className="space-y-0.5">
                          <div>Pages: {layout.pageCount}</div>
                          <div>Sections: {layout.sectionCount}</div>
                          <div>Questions: {layout.questionCount}</div>
                          <div>Images: {layout.figureCount}</div>
                          <div>Tables: {layout.tableCount}</div>
                          <div>{layout.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.LAYOUT_PROCESSING ? (
                        "Layout started…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {diagrams ? (
                        <div className="space-y-0.5">
                          <div>Count: {diagrams.diagramCount}</div>
                          <div>{formatFileSize(diagrams.totalBytes)}</div>
                          <div>{diagrams.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.DIAGRAM_EXTRACTION ? (
                        "Extracting…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {structuring ? (
                        <div className="space-y-0.5">
                          <div>Q: {structuring.questionCount}</div>
                          <div>Units: {structuring.unitCount}</div>
                          <div>Topics: {structuring.topicCount}</div>
                          <div>Diagrams: {structuring.diagramCount}</div>
                          <div>{structuring.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.STRUCTURING ? (
                        "Structuring…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {schema ? (
                        <div className="space-y-0.5">
                          <div>Q: {schema.questionCount}</div>
                          <div>Modules: {schema.moduleCount}</div>
                          <div>Topics: {schema.topicCount}</div>
                          <div>Diagrams: {schema.diagramCount}</div>
                          <div>{schema.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.SCHEMA_BUILDING ? (
                        "Building…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {validation ? (
                        <div className="space-y-0.5">
                          <div>{validation.status}</div>
                          <div>Errors: {validation.errorCount}</div>
                          <div>Warnings: {validation.warningCount}</div>
                          <div>{validation.durationMs} ms</div>
                        </div>
                      ) : job.stage === PipelineStage.VALIDATING ? (
                        "Validating…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {writing ? (
                        <div className="space-y-0.5">
                          <div>{writing.status}</div>
                          <div>Created: {writing.filesCreated}</div>
                          <div>Modified: {writing.filesModified}</div>
                          <div>Q+: {writing.questionsAdded}</div>
                          <div>
                            Diagrams: {writing.diagramsCopied}c /{" "}
                            {writing.diagramsReused}r /{" "}
                            {writing.diagramsSkipped}s
                          </div>
                        </div>
                      ) : job.stage === PipelineStage.WRITING ||
                        job.stage === PipelineStage.DIAGRAMS_WRITING ? (
                        "Writing…"
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={isRunning || !canRunOcr(job)}
                          onClick={() => {
                            void runOcr(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400"
                        >
                          {isOcrRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              OCR…
                            </>
                          ) : (
                            <>
                              <ScanText className="h-3.5 w-3.5" />
                              Run OCR
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunLayout(job)}
                          onClick={() => {
                            void runLayout(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400"
                        >
                          {isLayoutRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Layout…
                            </>
                          ) : (
                            <>
                              <LayoutGrid className="h-3.5 w-3.5" />
                              Run Layout
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunDiagrams(job)}
                          onClick={() => {
                            void runDiagrams(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300"
                        >
                          {isDiagramsRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Diagrams…
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3.5 w-3.5" />
                              Run Diagrams
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunStructuring(job)}
                          onClick={() => {
                            void runStructuring(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-800 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-300"
                        >
                          {isStructuringRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Structuring…
                            </>
                          ) : (
                            <>
                              <Brain className="h-3.5 w-3.5" />
                              Run Structuring
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunSchema(job)}
                          onClick={() => {
                            void runSchema(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-800 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                        >
                          {isSchemaRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Schema…
                            </>
                          ) : (
                            <>
                              <FileJson className="h-3.5 w-3.5" />
                              Run Schema
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunValidation(job)}
                          onClick={() => {
                            void runValidation(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-800 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                        >
                          {isValidationRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Validate…
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Run Validation
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isRunning || !canRunWriter(job)}
                          onClick={() => {
                            void runWriter(job.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-800 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300"
                        >
                          {isWriterRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Writing…
                            </>
                          ) : (
                            <>
                              <PenLine className="h-3.5 w-3.5" />
                              Run Writer
                            </>
                          )}
                        </button>
                        {ocr && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDetail({
                                kind: "ocr",
                                jobId: job.id,
                                summary: ocr,
                              })
                            }
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View extraction
                          </button>
                        )}
                        {layout && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDetail({
                                kind: "layout",
                                jobId: job.id,
                                summary: layout,
                              })
                            }
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View structure
                          </button>
                        )}
                        {diagrams && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDetail({
                                kind: "diagrams",
                                jobId: job.id,
                                summary: diagrams,
                              })
                            }
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View diagrams
                          </button>
                        )}
                        {structuring && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDetail({
                                kind: "structuring",
                                jobId: job.id,
                                summary: structuring,
                              })
                            }
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View academic
                          </button>
                        )}
                        {schema && (
                          <button
                            type="button"
                            onClick={() => {
                              void openSchemaDetail(job.id, schema);
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View JSON preview
                          </button>
                        )}
                        {validation && (
                          <button
                            type="button"
                            onClick={async () => {
                              const response = await fetch(
                                `${API_ENDPOINTS.CMS_VALIDATION}/${encodeURIComponent(job.id)}`
                              );
                              const data = (await response.json()) as {
                                success: boolean;
                                report?: ValidationReport;
                              };
                              if (data.success && data.report) {
                                setSelectedDetail({
                                  kind: "validation",
                                  jobId: job.id,
                                  summary: validation,
                                  report: data.report,
                                });
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View validation
                          </button>
                        )}
                        {writing && (
                          <button
                            type="button"
                            onClick={async () => {
                              const response = await fetch(
                                `${API_ENDPOINTS.CMS_WRITE}/${encodeURIComponent(job.id)}`
                              );
                              const data = (await response.json()) as {
                                success: boolean;
                                report?: WriteReport;
                                manifest?: DiagramManifest | null;
                              };
                              if (data.success && data.report) {
                                setSelectedDetail({
                                  kind: "writing",
                                  jobId: job.id,
                                  summary: writing,
                                  report: data.report,
                                  manifest: data.manifest ?? null,
                                });
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View write report
                          </button>
                        )}
                        {writing?.manifestPath && (
                          <button
                            type="button"
                            onClick={async () => {
                              const response = await fetch(
                                `${API_ENDPOINTS.CMS_WRITE}/${encodeURIComponent(job.id)}`
                              );
                              const data = (await response.json()) as {
                                success: boolean;
                                report?: WriteReport;
                                manifest?: DiagramManifest | null;
                              };
                              if (data.success && data.report) {
                                setSelectedDetail({
                                  kind: "writing",
                                  jobId: job.id,
                                  summary: writing,
                                  report: data.report,
                                  manifest: data.manifest ?? null,
                                });
                              }
                            }}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                          >
                            View diagram manifest
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDetail?.kind === "ocr" && (
        <div
          id="ocr-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                OCR extraction summary
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">OCR started</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OCR completed</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5">{selectedDetail.summary.durationMs} ms</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Engine</dt>
              <dd className="mt-0.5">{selectedDetail.summary.engine}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pages extracted</dt>
              <dd className="mt-0.5">{selectedDetail.summary.pageCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Images extracted
              </dt>
              <dd className="mt-0.5">{selectedDetail.summary.imageCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Tables extracted
              </dt>
              <dd className="mt-0.5">{selectedDetail.summary.tableCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Text blocks</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.textBlockCount}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Artifacts saved under the job workspace (
            {selectedDetail.summary.rawDocumentPath}, pages/, images/, tables/).
            No content JSON was generated.
          </p>
        </div>
      )}

      {selectedDetail?.kind === "layout" && (
        <div
          id="layout-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Structured document summary
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Layout started</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Layout completed
              </dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5">{selectedDetail.summary.durationMs} ms</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Detector</dt>
              <dd className="mt-0.5">{selectedDetail.summary.detector}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pages</dt>
              <dd className="mt-0.5">{selectedDetail.summary.pageCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Detected sections
              </dt>
              <dd className="mt-0.5">{selectedDetail.summary.sectionCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Detected questions
              </dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.questionCount} (
                {selectedDetail.summary.subQuestionCount} sub)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Images / tables</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.figureCount} /{" "}
                {selectedDetail.summary.tableCount}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Structure saved as {selectedDetail.summary.structuredDocumentPath}.
            Layout only — no Gemini, syllabus, or PYQ JSON.
          </p>
        </div>
      )}

      {selectedDetail?.kind === "diagrams" && (
        <div
          id="diagram-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Extracted diagrams
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Started</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completed</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5">{selectedDetail.summary.durationMs} ms</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Diagram count / size
              </dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.diagramCount} /{" "}
                {formatFileSize(selectedDetail.summary.totalBytes)}
              </dd>
            </div>
          </dl>

          {selectedDetail.summary.diagrams.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedDetail.summary.diagrams.map((diagram) => (
                <figure
                  key={diagram.id}
                  className="overflow-hidden rounded-lg border border-border bg-background"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={diagramPreviewUrl(selectedDetail.jobId, diagram.path)}
                    alt={diagram.filename}
                    className="h-40 w-full object-contain bg-muted/40"
                  />
                  <figcaption className="space-y-0.5 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">
                      {diagram.filename}
                    </div>
                    <div>
                      Page {diagram.pageNumber} · {diagram.width}×
                      {diagram.height}
                    </div>
                    <div>{formatFileSize(diagram.fileSizeBytes)} WEBP</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No figure blocks were available to crop. Image uploads with
              detected figures produce diagram assets here.
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Assets stored under {selectedDetail.summary.diagramsDir}/. No AI
            captions or content JSON.
          </p>
        </div>
      )}

      {selectedDetail?.kind === "structuring" && (
        <div
          id="structuring-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Academic document summary
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Started</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completed</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5">{selectedDetail.summary.durationMs} ms</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Model</dt>
              <dd className="mt-0.5">{selectedDetail.summary.model}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Questions</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.questionCount} (
                {selectedDetail.summary.subQuestionCount} sub)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Units / topics</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.unitCount} /{" "}
                {selectedDetail.summary.topicCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Diagrams</dt>
              <dd className="mt-0.5">{selectedDetail.summary.diagramCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Token usage</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.totalTokens != null
                  ? `${selectedDetail.summary.totalTokens} total`
                  : "—"}
                {selectedDetail.summary.promptTokens != null
                  ? ` (${selectedDetail.summary.promptTokens} prompt / ${selectedDetail.summary.completionTokens ?? "—"} completion)`
                  : ""}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Saved as {selectedDetail.summary.academicDocumentPath}. Intermediate
            AcademicDocument only — no pyqs.json / syllabus.json / content/
            writes.
          </p>
        </div>
      )}

      {selectedDetail?.kind === "schema" && (
        <div
          id="schema-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Production JSON preview
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Started</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completed</dt>
              <dd className="mt-0.5">
                {formatDate(selectedDetail.summary.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Processing time</dt>
              <dd className="mt-0.5">{selectedDetail.summary.durationMs} ms</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Questions</dt>
              <dd className="mt-0.5">
                {selectedDetail.summary.questionCount} (
                {selectedDetail.summary.subQuestionCount} sub)
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Modules</dt>
              <dd className="mt-0.5">{selectedDetail.summary.moduleCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Topics</dt>
              <dd className="mt-0.5">{selectedDetail.summary.topicCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Diagrams</dt>
              <dd className="mt-0.5">{selectedDetail.summary.diagramCount}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Preview artifacts: {selectedDetail.summary.pyqsPath ?? "—"} /{" "}
            {selectedDetail.summary.syllabusPath ?? "—"}. Not written to
            content/.
          </p>
          {schemaPreviewLoading ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Loading preview…
            </p>
          ) : schemaPreview ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {schemaPreview.pyqs != null && (
                <div>
                  <h4 className="text-xs font-medium text-foreground">
                    production-pyqs.json
                  </h4>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(schemaPreview.pyqs, null, 2)}
                  </pre>
                </div>
              )}
              {schemaPreview.syllabus != null && (
                <div>
                  <h4 className="text-xs font-medium text-foreground">
                    production-syllabus.json
                  </h4>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(schemaPreview.syllabus, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Preview JSON unavailable.
            </p>
          )}
        </div>
      )}

      {selectedDetail?.kind === "validation" && (
        <div
          id="validation-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Validation report
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd
                className={cn(
                  "mt-0.5 font-medium",
                  selectedDetail.report.status === "PASS"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {selectedDetail.report.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Errors</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.statistics.errorCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Warnings</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.statistics.warningCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Questions</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.statistics.questionCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Modules / topics
              </dt>
              <dd className="mt-0.5">
                {selectedDetail.report.statistics.moduleCount} /{" "}
                {selectedDetail.report.statistics.topicCount}
              </dd>
            </div>
          </dl>
          {selectedDetail.report.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Errors ({selectedDetail.report.errors.length})
              </h4>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
                {selectedDetail.report.errors.map((issue) => (
                  <li key={issue.id} className="font-mono">
                    [{issue.code}] {issue.message}
                    {issue.path ? ` — ${issue.path}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedDetail.report.warnings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Warnings ({selectedDetail.report.warnings.length})
              </h4>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
                {selectedDetail.report.warnings.map((issue) => (
                  <li key={issue.id} className="font-mono">
                    [{issue.code}] {issue.message}
                    {issue.path ? ` — ${issue.path}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Saved as {selectedDetail.summary.reportPath}. Preview only — no
            content/ writes.
          </p>
        </div>
      )}

      {selectedDetail?.kind === "writing" && (
        <div
          id="write-results"
          className="border-t border-border bg-muted/20 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Write report
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {selectedDetail.jobId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetail(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd
                className={cn(
                  "mt-0.5 font-medium",
                  selectedDetail.report.status === "SUCCESS"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {selectedDetail.report.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Files created</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.filesCreated.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Files modified</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.filesModified.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Questions added</dt>
              <dd className="mt-0.5">{selectedDetail.report.questionsAdded}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Topics added</dt>
              <dd className="mt-0.5">{selectedDetail.report.topicsAdded}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Diagrams copied</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.diagrams.diagramsCopied}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Diagrams reused</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.diagrams.diagramsReused}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Diagrams skipped
              </dt>
              <dd className="mt-0.5">
                {selectedDetail.report.diagrams.diagramsSkipped}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Storage copied</dt>
              <dd className="mt-0.5">
                {formatFileSize(
                  selectedDetail.report.diagrams.storageBytesCopied
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Errors</dt>
              <dd className="mt-0.5">{selectedDetail.report.errors.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Warnings</dt>
              <dd className="mt-0.5">
                {selectedDetail.report.warnings.length}
              </dd>
            </div>
          </dl>
          {selectedDetail.report.contentDir && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Target: {selectedDetail.report.contentDir}
            </p>
          )}
          {selectedDetail.report.diagrams.destinationFolders.length > 0 && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Folders:{" "}
              {selectedDetail.report.diagrams.destinationFolders.join(", ")}
            </p>
          )}
          {selectedDetail.manifest && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-foreground">
                Diagram manifest ({selectedDetail.manifest.statistics.total})
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Copied {selectedDetail.manifest.statistics.copied} · Reused{" "}
                {selectedDetail.manifest.statistics.reused} · Skipped{" "}
                {selectedDetail.manifest.statistics.skipped} · Errors{" "}
                {selectedDetail.manifest.statistics.errors}
              </p>
              <ul className="mt-2 max-h-56 space-y-1 overflow-auto text-xs text-muted-foreground">
                {selectedDetail.manifest.entries.map((entry, index) => (
                  <li
                    key={`${entry.originalPath}-${index}`}
                    className="font-mono"
                  >
                    {entry.copied
                      ? "copied"
                      : entry.reused
                        ? "reused"
                        : "skipped"}
                    : {entry.originalPath} → {entry.newPath}
                    {entry.error ? ` (${entry.error})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedDetail.report.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Errors ({selectedDetail.report.errors.length})
              </h4>
              <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-muted-foreground">
                {selectedDetail.report.errors.map((issue) => (
                  <li key={issue.id} className="font-mono">
                    [{issue.code}] {issue.message}
                    {issue.path ? ` — ${issue.path}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Saved as {selectedDetail.summary.reportPath}
            {selectedDetail.summary.manifestPath
              ? ` / ${selectedDetail.summary.manifestPath}`
              : ""}
            . Git remains a manual review step.
          </p>
        </div>
      )}
    </section>
  );
}
