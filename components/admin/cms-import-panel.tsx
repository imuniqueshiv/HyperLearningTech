"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Trash2, XCircle } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { ImportJobRecord } from "@/lib/content-pipeline";
import {
  formatFileSize,
  getImportSessionStatus,
  getSessionProgressLabel,
  getSessionStepStates,
  IMPORT_SESSION_STEPS,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

export type CmsListTab =
  | "active"
  | "review"
  | "completed"
  | "failed"
  | "history";

interface CmsImportPanelProps {
  jobs: ImportJobRecord[];
  loading?: boolean;
  activeTab: CmsListTab;
  onTabChange: (tab: CmsListTab) => void;
  onRefresh?: () => void;
  onReviewJob?: (jobId: string) => void;
  onDeleted?: (jobId: string) => void;
  counts: {
    active: number;
    review: number;
    completed: number;
    failed: number;
  };
}

function paperLabel(job: ImportJobRecord): string {
  const code = job.subjectCode?.trim();
  const name = job.originalFilename.replace(/\.[^.]+$/, "");
  if (code) return `${code} · ${name}`;
  return name;
}

const FRIENDLY_STEP_LABELS: Record<string, string> = {
  ocr: "Reading pages",
  layout: "Analyzing layout",
  reconstruction: "Reconstructing content",
  gemini: "Extracting questions",
  schema: "Structuring questions",
  validation: "Validating extracted questions",
  merge: "Preparing review package",
  writer: "Writing review package",
};

function friendlyStep(job: ImportJobRecord): string {
  const status = getImportSessionStatus(job);
  if (status === "Queued") return "Waiting to start…";
  const states = getSessionStepStates(job);
  const runningId = IMPORT_SESSION_STEPS.find(
    (s) => states[s.id] === "running"
  )?.id;
  if (runningId && FRIENDLY_STEP_LABELS[runningId]) {
    return FRIENDLY_STEP_LABELS[runningId];
  }
  const progress = getSessionProgressLabel(job);
  if (progress && !/OCR|Gemini|Schema|Layout|Merge|Write/i.test(progress)) {
    return progress;
  }
  return "Processing paper…";
}

function progressPercent(job: ImportJobRecord): number {
  const states = getSessionStepStates(job);
  const ids = IMPORT_SESSION_STEPS.map((s) => s.id);
  if (ids.length === 0) return 10;
  const done = ids.filter((id) => states[id] === "done").length;
  const running = ids.some((id) => states[id] === "running") ? 0.5 : 0;
  return Math.min(95, Math.round(((done + running) / ids.length) * 100));
}

export function CmsImportPanel({
  jobs,
  loading,
  activeTab,
  onTabChange,
  onRefresh,
  onReviewJob,
  onDeleted,
  counts,
}: CmsImportPanelProps) {
  const [expandedTech, setExpandedTech] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const visible = useMemo(() => {
    return jobs.filter((job) => {
      const status = getImportSessionStatus(job);
      switch (activeTab) {
        case "active":
          return status === "Queued" || status === "Running";
        case "review":
          return status === "Review Ready";
        case "completed":
          return status === "Completed";
        case "failed":
          return status === "Failed";
        default:
          return true;
      }
    });
  }, [jobs, activeTab]);

  const tabs: { id: CmsListTab; label: string; count: number }[] = [
    { id: "active", label: "Processing", count: counts.active },
    { id: "review", label: "Needs Review", count: counts.review },
    { id: "completed", label: "Saved", count: counts.completed },
    { id: "failed", label: "Failed", count: counts.failed },
    { id: "history", label: "History", count: -1 },
  ];

  async function resume(jobId: string) {
    setBusyId(jobId);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_RECOVERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "resume" }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Resume failed.");
      }
      onRefresh?.();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [jobId]: error instanceof Error ? error.message : "Resume failed.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(jobId: string) {
    setBusyId(jobId);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_RECOVERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action: "cancel" }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Cancel failed.");
      }
      onRefresh?.();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [jobId]: error instanceof Error ? error.message : "Cancel failed.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteHistory(jobId: string) {
    setBusyId(jobId);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_HISTORY, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Delete failed.");
      }
      setConfirmDeleteId(null);
      onDeleted?.(jobId);
      onRefresh?.();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [jobId]: error instanceof Error ? error.message : "Delete failed.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  if (activeTab === "history") {
    return (
      <section
        id="imports"
        className="rounded-2xl border border-border bg-card"
      >
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        <p className="px-5 py-6 text-sm text-muted-foreground">
          Full import history is below. Use search, filters, and delete there.
        </p>
      </section>
    );
  }

  return (
    <section id="imports" className="rounded-2xl border border-border bg-card">
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

      {loading && visible.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((job) => {
            const status = getImportSessionStatus(job);
            const techOpen = Boolean(expandedTech[job.id]);
            const pct =
              status === "Running" || status === "Queued"
                ? progressPercent(job)
                : status === "Completed"
                  ? 100
                  : null;

            return (
              <li key={job.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {paperLabel(job)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        job.semester,
                        job.examSession,
                        job.year,
                        formatFileSize(job.fileSize),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {(status === "Running" || status === "Queued") && (
                      <div className="mt-3 max-w-md">
                        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                          <span>{friendlyStep(job)}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${pct ?? 10}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {status === "Review Ready" && (
                      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                        Ready for review
                        {job.schema?.questionCount
                          ? ` · ${job.schema.questionCount} questions`
                          : ""}
                      </p>
                    )}

                    {status === "Failed" && job.error && (
                      <p className="mt-2 line-clamp-2 text-xs text-rose-600 dark:text-rose-400">
                        {job.error}
                      </p>
                    )}

                    {errors[job.id] && (
                      <p className="mt-2 text-xs text-rose-600">
                        {errors[job.id]}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={status} />
                    {status === "Review Ready" && (
                      <button
                        type="button"
                        onClick={() => onReviewJob?.(job.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Review Paper
                      </button>
                    )}
                    {status === "Completed" && (
                      <button
                        type="button"
                        onClick={() => onReviewJob?.(job.id)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        View
                      </button>
                    )}
                    {status === "Failed" && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => void resume(job.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                    {(status === "Running" || status === "Queued") && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => void cancel(job.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </button>
                    )}
                    {status !== "Running" && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => setConfirmDeleteId(job.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-60"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTech((prev) => ({
                          ...prev,
                          [job.id]: !prev[job.id],
                        }))
                      }
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      {techOpen ? "Hide details" : "Technical details"}
                    </button>
                  </div>
                </div>

                {techOpen && <TechnicalDetails job={job} />}

                {confirmDeleteId === job.id && (
                  <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">
                      Delete import history?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Removes the session and temporary processing artifacts.
                      Saved content JSON is never deleted.
                    </p>
                    {status === "Completed" && (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                        ✓ Saved content will remain untouched.
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => void deleteHistory(job.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: CmsListTab; label: string; count: number }[];
  activeTab: CmsListTab;
  onTabChange: (tab: CmsListTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border px-3 pt-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-t-lg px-3 py-2 text-xs font-medium transition",
            activeTab === tab.id
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count >= 0 ? (
            <span className="ml-1.5 text-muted-foreground">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function StatusChip({
  status,
}: {
  status: ReturnType<typeof getImportSessionStatus>;
}) {
  const tone =
    status === "Review Ready" || status === "Completed"
      ? "text-emerald-700 bg-emerald-500/10"
      : status === "Failed"
        ? "text-rose-700 bg-rose-500/10"
        : "text-blue-700 bg-blue-500/10";
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}
    >
      {status === "Review Ready"
        ? "Review"
        : status === "Completed"
          ? "Saved"
          : status}
    </span>
  );
}

function EmptyState({ tab }: { tab: CmsListTab }) {
  const copy: Record<Exclude<CmsListTab, "history">, string> = {
    active: "No papers are currently processing.",
    review: "No papers need review.",
    completed: "No saved imports yet.",
    failed: "No failed imports.",
  };
  return (
    <p className="px-5 py-10 text-sm text-muted-foreground">
      {copy[tab as Exclude<CmsListTab, "history">] ?? "Nothing here."}
    </p>
  );
}

function TechnicalDetails({ job }: { job: ImportJobRecord }) {
  const states = getSessionStepStates(job);
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
      <p>
        Import ID: <span className="font-mono text-foreground">{job.id}</span>
      </p>
      <p className="mt-1">
        Stage: {job.stage} · Status: {job.status}
      </p>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {IMPORT_SESSION_STEPS.map((step) => (
          <li key={step.id}>
            {step.label}: {states[step.id]}
          </li>
        ))}
      </ul>
    </div>
  );
}
