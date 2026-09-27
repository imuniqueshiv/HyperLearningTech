"use client";

import {
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  type ContentImportJob,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ReviewQueueProps {
  jobs: ContentImportJob[];
}

export function ReviewQueue({ jobs }: ReviewQueueProps) {
  const queue = jobs.filter((job) => job.status === "awaiting_review");

  return (
    <section
      id="review-queue"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Review Queue</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Jobs waiting for human approval before write
        </p>
      </header>

      {queue.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          Review queue is empty.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {queue.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {job.fileName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {JOB_TYPE_LABELS[job.type]} · {job.target.branch}/
                  {job.target.semester}/{job.target.subject}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                  )}
                >
                  {IMPORT_STATUS_LABELS[job.status]}
                </span>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  onClick={() => {
                    // Phase 1: no-op
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
                  onClick={() => {
                    // Phase 1: no-op
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-500/20 dark:text-red-400"
                  onClick={() => {
                    // Phase 1: no-op
                  }}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
