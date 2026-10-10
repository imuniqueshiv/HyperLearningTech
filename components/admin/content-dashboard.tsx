"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import {
  CmsImportPanel,
  type CmsListTab,
} from "@/components/admin/cms-import-panel";
import { CmsSidebar } from "@/components/admin/cms-sidebar";
import { ContentUpload } from "@/components/admin/content-upload";
import { ImportHistory } from "@/components/admin/import-history";
import { ReviewCenter } from "@/components/admin/review-center";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ImportJobRecord,
  QueueListApiResult,
} from "@/lib/content-pipeline";
import { CMS_ROUTES, getImportSessionStatus } from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ImportNotification {
  id: string;
  jobId: string;
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
  const notifiedEvents = useRef<Set<string>>(new Set());
  const [pollTick, setPollTick] = useState(0);
  const [listTab, setListTab] = useState<CmsListTab>("active");
  const [focusReviewJobId, setFocusReviewJobId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const applyJobs = useCallback((next: ImportJobRecord[]) => {
    const notes: ImportNotification[] = [];

    for (const job of next) {
      const status = getImportSessionStatus(job);
      const prior = previousStatus.current[job.id];
      if (prior && prior !== status) {
        if (status === "Review Ready") {
          const eventKey = `${job.id}:Review Ready`;
          if (!notifiedEvents.current.has(eventKey)) {
            notifiedEvents.current.add(eventKey);
            const label = job.subjectCode
              ? `${job.subjectCode} ${job.originalFilename}`
              : job.originalFilename;
            notes.push({
              id: eventKey,
              jobId: job.id,
              kind: "success",
              title: `${label} is ready for review.`,
              detail: "Open Review to inspect questions and save.",
            });
          }
        }
        if (status === "Failed") {
          const eventKey = `${job.id}:Failed`;
          if (!notifiedEvents.current.has(eventKey)) {
            notifiedEvents.current.add(eventKey);
            notes.push({
              id: eventKey,
              jobId: job.id,
              kind: "failure",
              title: "Import failed.",
              detail: job.error || `${job.originalFilename} failed.`,
            });
          }
        }
      }
      previousStatus.current[job.id] = status;
    }

    setJobs(next);
    if (notes.length > 0) {
      setNotifications((prev) => {
        const withoutDup = prev.filter(
          (n) =>
            !notes.some(
              (note) => note.jobId === n.jobId && note.kind === n.kind
            )
        );
        return [...notes, ...withoutDup].slice(0, 4);
      });
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    setQueueError(null);
    try {
      const next = await fetchQueueJobs();
      applyJobs(next);
    } catch (error) {
      setQueueError(
        error instanceof Error ? error.message : "Failed to load import queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }, [applyJobs]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchQueueJobs();
        if (cancelled) return;
        applyJobs(next);
      } catch (error) {
        if (cancelled) return;
        setQueueError(
          error instanceof Error
            ? error.message
            : "Failed to load import queue."
        );
      } finally {
        if (!cancelled) setQueueLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyJobs, pollTick]);

  useEffect(() => {
    const hasActive = jobs.some((job) => {
      const status = getImportSessionStatus(job);
      return status === "Queued" || status === "Running";
    });
    if (!hasActive) return;
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

  const counts = useMemo(() => {
    let active = 0;
    let review = 0;
    let completed = 0;
    let failed = 0;
    for (const job of jobs) {
      switch (getImportSessionStatus(job)) {
        case "Queued":
        case "Running":
          active += 1;
          break;
        case "Review Ready":
          review += 1;
          break;
        case "Completed":
          completed += 1;
          break;
        case "Failed":
          failed += 1;
          break;
      }
    }
    return { active, review, completed, failed };
  }, [jobs]);

  function openReview(jobId: string) {
    setFocusReviewJobId(jobId);
    setListTab("review");
    window.requestAnimationFrame(() => {
      document.getElementById("review")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <CmsSidebar
        activeHref={CMS_ROUTES.content}
        onNavigate={(section) => {
          if (section === "history") {
            setShowHistory(true);
            setListTab("history");
          } else if (section === "review") {
            setListTab("review");
          } else if (section === "imports") {
            setListTab("active");
          }
        }}
      />

      <div className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Content CMS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Import → Process → Review → Approve → Save JSON
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.detail}
                  </p>
                  {note.kind === "success" && (
                    <button
                      type="button"
                      onClick={() => openReview(note.jobId)}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Review Paper
                    </button>
                  )}
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

        <div className="grid gap-3 sm:grid-cols-4">
          {(
            [
              ["active", "Processing", counts.active],
              ["review", "Needs Review", counts.review],
              ["completed", "Saved", counts.completed],
              ["failed", "Failed", counts.failed],
            ] as const
          ).map(([tab, label, value]) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setListTab(tab);
                setShowHistory(false);
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                listTab === tab
                  ? "border-blue-500/40 bg-blue-500/5"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {value}
              </p>
            </button>
          ))}
        </div>

        <ContentUpload
          onJobsCreated={(created) => {
            for (const job of created) {
              previousStatus.current[job.id] = getImportSessionStatus(job);
              upsertJob(job);
            }
            setListTab("active");
            void refreshQueue();
          }}
        />

        {queueError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {queueError}
          </p>
        )}

        <CmsImportPanel
          jobs={jobs}
          loading={queueLoading}
          activeTab={listTab}
          counts={counts}
          onTabChange={(tab) => {
            setListTab(tab);
            setShowHistory(tab === "history");
          }}
          onRefresh={() => {
            void refreshQueue();
          }}
          onReviewJob={openReview}
          onDeleted={(jobId) => {
            setJobs((prev) => prev.filter((j) => j.id !== jobId));
            if (focusReviewJobId === jobId) setFocusReviewJobId(null);
          }}
        />

        <ReviewCenter
          jobs={jobs}
          focusJobId={focusReviewJobId}
          onFocusConsumed={() => setFocusReviewJobId(null)}
          onRefresh={() => {
            void refreshQueue();
          }}
          onJobUpdated={upsertJob}
        />

        {(showHistory || listTab === "history") && (
          <ImportHistory
            onDeleted={() => {
              void refreshQueue();
            }}
          />
        )}

        {!showHistory && listTab !== "history" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowHistory(true);
                setListTab("history");
              }}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
