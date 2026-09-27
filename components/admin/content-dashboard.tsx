"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { CmsSidebar } from "@/components/admin/cms-sidebar";
import { ContentUpload } from "@/components/admin/content-upload";
import { ImportHistory } from "@/components/admin/import-history";
import { ImportQueue } from "@/components/admin/import-queue";
import { PipelineSummary } from "@/components/admin/pipeline-summary";
import { ReviewCenter } from "@/components/admin/review-center";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ImportJobRecord,
  QueueListApiResult,
} from "@/lib/content-pipeline";
import {
  CMS_ROUTES,
  CMS_STORAGE_PROVIDER_LABEL,
  getImportSessionStatus,
} from "@/lib/content-pipeline";

interface ImportNotification {
  id: string;
  kind: "success" | "failure";
  title: string;
  detail: string;
}

async function fetchQueueJobs(): Promise<ImportJobRecord[]> {
  const response = await fetch(API_ENDPOINTS.CMS_QUEUE, {
    method: "GET",
    cache: "no-store",
  });
  const data = (await response.json()) as QueueListApiResult;

  if (!response.ok || !data.success) {
    throw new Error(
      !data.success && data.error ? data.error : "Failed to load import queue."
    );
  }

  return data.jobs;
}

export function ContentDashboard() {
  const [jobs, setJobs] = useState<ImportJobRecord[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ImportNotification[]>([]);
  const previousStatus = useRef<Record<string, string>>({});
  const [pollTick, setPollTick] = useState(0);

  const applyJobs = useCallback((next: ImportJobRecord[]) => {
    const notes: ImportNotification[] = [];

    for (const job of next) {
      const status = getImportSessionStatus(job);
      const prior = previousStatus.current[job.id];
      if (prior && prior !== status) {
        if (status === "Review Ready") {
          notes.push({
            id: `${job.id}-ready-${Date.now()}`,
            kind: "success",
            title: "Import completed successfully.",
            detail: `${job.originalFilename} is ready for review.`,
          });
        }
        if (status === "Failed") {
          notes.push({
            id: `${job.id}-fail-${Date.now()}`,
            kind: "failure",
            title: "Import failed.",
            detail: job.error || `${job.originalFilename} failed.`,
          });
        }
      }
      previousStatus.current[job.id] = status;
    }

    setJobs(next);
    if (notes.length > 0) {
      setNotifications((prev) => [...notes, ...prev].slice(0, 5));
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    setQueueError(null);

    try {
      const next = await fetchQueueJobs();
      applyJobs(next);
      setQueueError(null);
    } catch (error) {
      setQueueError(
        error instanceof Error ? error.message : "Failed to load import queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }, [applyJobs]);

  // Initial load + poll trigger
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const next = await fetchQueueJobs();
        if (cancelled) return;
        applyJobs(next);
        setQueueError(null);
      } catch (error) {
        if (cancelled) return;
        setQueueError(
          error instanceof Error
            ? error.message
            : "Failed to load import queue."
        );
      } finally {
        if (!cancelled) {
          setQueueLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyJobs, pollTick]);

  // Poll while any session is queued or running.
  useEffect(() => {
    const hasActive = jobs.some((job) => {
      const status = getImportSessionStatus(job);
      return status === "Queued" || status === "Running";
    });
    if (!hasActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setPollTick((tick) => tick + 1);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [jobs]);

  function upsertJob(job: ImportJobRecord) {
    setJobs((prev) => {
      const without = prev.filter((item) => item.id !== job.id);
      return [job, ...without];
    });
  }

  const runningJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const status = getImportSessionStatus(job);
        return status === "Queued" || status === "Running";
      }),
    [jobs]
  );

  const failedJobs = useMemo(
    () => jobs.filter((job) => getImportSessionStatus(job) === "Failed"),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((job) => getImportSessionStatus(job) === "Completed"),
    [jobs]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <CmsSidebar activeHref={CMS_ROUTES.content} />

      <div className="min-w-0 flex-1 space-y-8">
        <header>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Admin · Content Management
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Content CMS
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Import an academic document — processing runs automatically.
            Storage: {CMS_STORAGE_PROVIDER_LABEL}.
          </p>
        </header>

        {notifications.length > 0 && (
          <div className="space-y-2" aria-live="polite">
            {notifications.map((note) => (
              <div
                key={note.id}
                className={
                  note.kind === "success"
                    ? "flex items-start justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm"
                    : "flex items-start justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm"
                }
              >
                <div>
                  <p className="font-medium text-foreground">{note.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {note.detail}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((item) => item.id !== note.id)
                    )
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <PipelineSummary jobs={jobs} />

        <ContentUpload
          onJobsCreated={(created) => {
            for (const job of created) {
              previousStatus.current[job.id] = getImportSessionStatus(job);
              upsertJob(job);
            }
            void refreshQueue();
          }}
        />

        {queueError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {queueError}
          </p>
        )}

        <ImportQueue
          sectionId="running"
          title="Running Imports"
          emptyMessage="No imports are running."
          jobs={runningJobs}
          loading={queueLoading}
          onRefresh={() => {
            void refreshQueue();
          }}
          onJobUpdated={upsertJob}
        />

        <ReviewCenter
          jobs={jobs}
          onRefresh={() => {
            void refreshQueue();
          }}
          onJobUpdated={upsertJob}
        />

        <ImportQueue
          sectionId="failed"
          title="Failed"
          emptyMessage="No failed imports."
          jobs={failedJobs}
          onRefresh={() => {
            void refreshQueue();
          }}
          onJobUpdated={upsertJob}
        />

        <ImportQueue
          sectionId="completed"
          title="Completed"
          emptyMessage="No completed imports yet."
          jobs={completedJobs}
          onRefresh={() => {
            void refreshQueue();
          }}
          onJobUpdated={upsertJob}
        />

        <ImportHistory />
      </div>
    </div>
  );
}
