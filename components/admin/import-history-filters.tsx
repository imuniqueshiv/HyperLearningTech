"use client";

import type {
  HistoryListFilters,
  ImportStatus,
  JobType,
} from "@/lib/content-pipeline";
import { IMPORT_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/content-pipeline";

interface ImportHistoryFiltersProps {
  filters: HistoryListFilters;
  onChange: (next: HistoryListFilters) => void;
}

const STATUS_OPTIONS: Array<ImportStatus | "all"> = [
  "all",
  "queued",
  "processing",
  "awaiting_review",
  "approved",
  "rejected",
  "failed",
  "completed",
  "cancelled",
];

const TYPE_OPTIONS: Array<JobType | "all"> = [
  "all",
  "syllabus",
  "pyq",
  "diagram",
  "bulk",
];

const SORT_OPTIONS: Array<NonNullable<HistoryListFilters["sort"]>> = [
  "newest",
  "oldest",
  "duration",
  "status",
];

export function ImportHistoryFilters({
  filters,
  onChange,
}: ImportHistoryFiltersProps) {
  return (
    <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-1">
        Search
        <input
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Job ID, file, subject…"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        />
      </label>

      <label className="block text-xs font-medium text-muted-foreground">
        Status
        <select
          value={filters.status ?? "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as ImportStatus | "all",
            })
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All statuses" : IMPORT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-muted-foreground">
        Job type
        <select
          value={filters.jobType ?? "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              jobType: event.target.value as JobType | "all",
            })
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        >
          {TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type === "all" ? "All types" : JOB_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-muted-foreground">
        Sort
        <select
          value={filters.sort ?? "newest"}
          onChange={(event) =>
            onChange({
              ...filters,
              sort: event.target.value as HistoryListFilters["sort"],
            })
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {sort === "newest"
                ? "Newest first"
                : sort === "oldest"
                  ? "Oldest first"
                  : sort === "duration"
                    ? "Longest duration"
                    : "Status"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
