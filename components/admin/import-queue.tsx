"use client";

import { useState } from "react";
import { Check, Loader2, RotateCcw, X } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { ImportJobRecord } from "@/lib/content-pipeline";
import {
  formatFileSize,
  getImportSessionStatus,
  getSessionProgressLabel,
  getSessionStepStates,
  IMPORT_SESSION_STEPS,
  sessionStatusTone,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ImportQueueProps {
  jobs: ImportJobRecord[];
  loading?: boolean;
  onRefresh?: () => void;
  onJobUpdated?: (job: ImportJobRecord) => void;
  filterStatuses?: Array<ReturnType<typeof getImportSessionStatus>>;
  title?: string;
  emptyMessage?: string;
  sectionId?: string;
}

export function ImportQueue({
  jobs,
  loading,
  onRefresh,
  filterStatuses,
  title = "Imports",
  emptyMessage = "No imports yet.",
  sectionId = "queue",
}: ImportQueueProps) {
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visible = filterStatuses
    ? jobs.filter((job) => filterStatuses.includes(getImportSessionStatus(job)))
    : jobs;

  async function handleResume(job: ImportJobRecord) {
    setResumingId(job.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[job.id];
      return next;
    });

    try {
      const response = await fetch(API_ENDPOINTS.CMS_RECOVERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, action: "resume" }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Resume failed.");
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [job.id]: error instanceof Error ? error.message : "Resume failed.",
      }));
    } finally {
      setResumingId(null);
      onRefresh?.();
    }
  }

  return (
    <section
      id={sectionId}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {visible.length} session{visible.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {loading && visible.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((job) => {
            const status = getImportSessionStatus(job);
            const steps = getSessionStepStates(job);
            const progress = getSessionProgressLabel(job);

            return (
              <li key={job.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {job.originalFilename}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          sessionStatusTone(status)
                        )}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[job.branch, job.semester, job.subjectCode]
                        .filter(Boolean)
                        .join(" · ")}
                      {job.year != null && job.examSession
                        ? ` · ${job.examSession} ${job.year}`
                        : ""}
                      {" · "}
                      {formatFileSize(job.fileSize)}
                    </p>
                    <p className="mt-2 text-xs text-foreground/80">
                      {progress}
                    </p>

                    <ol className="mt-3 flex flex-wrap gap-2">
                      {IMPORT_SESSION_STEPS.map((step) => {
                        const state = steps[step.id];
                        return (
                          <li
                            key={step.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]",
                              state === "done" &&
                                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                              state === "running" &&
                                "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
                              state === "failed" &&
                                "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                              state === "pending" &&
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {state === "done" && <Check className="h-3 w-3" />}
                            {state === "running" && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {state === "failed" && <X className="h-3 w-3" />}
                            {step.label}
                          </li>
                        );
                      })}
                    </ol>

                    {errors[job.id] && (
                      <p
                        className="mt-2 text-xs text-rose-600 dark:text-rose-400"
                        role="alert"
                      >
                        {errors[job.id]}
                      </p>
                    )}
                    {status === "Failed" && job.error && !errors[job.id] && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-rose-600 dark:text-rose-400">
                        {job.error}
                      </p>
                    )}
                  </div>

                  {status === "Failed" && (
                    <button
                      type="button"
                      disabled={resumingId === job.id}
                      onClick={() => void handleResume(job)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                    >
                      {resumingId === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Resume
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
