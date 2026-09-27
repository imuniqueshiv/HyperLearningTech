"use client";

import {
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PIPELINE_STAGE_LABELS,
  type ContentImportJob,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface RecentImportsProps {
  jobs: ContentImportJob[];
}

function statusClass(status: ContentImportJob["status"]): string {
  switch (status) {
    case "completed":
    case "approved":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "failed":
    case "rejected":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "awaiting_review":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "processing":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function RecentImports({ jobs }: RecentImportsProps) {
  return (
    <section
      id="recent-imports"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Imports
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Latest content jobs (mock data)
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">
          No recent imports.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {job.fileName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {JOB_TYPE_LABELS[job.type]} ·{" "}
                  {job.target.subject.toUpperCase()} ·{" "}
                  {PIPELINE_STAGE_LABELS[job.stage]}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                  statusClass(job.status)
                )}
              >
                {IMPORT_STATUS_LABELS[job.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
