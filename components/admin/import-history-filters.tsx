"use client";

import type { HistoryListFilters, ImportStatus } from "@/lib/content-pipeline";
import { IMPORT_STATUS_LABELS } from "@/lib/content-pipeline";

interface ImportHistoryFiltersProps {
  filters: HistoryListFilters;
  onChange: (next: HistoryListFilters) => void;
}

const STATUS_OPTIONS: Array<ImportStatus | "all"> = [
  "all",
  "processing",
  "awaiting_review",
  "completed",
  "failed",
  "cancelled",
];

export function ImportHistoryFilters({
  filters,
  onChange,
}: ImportHistoryFiltersProps) {
  return (
    <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-3">
      <label className="block text-xs font-medium text-muted-foreground sm:col-span-1">
        Search
        <input
          value={filters.search ?? ""}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="AL-405, filename, job ID…"
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
              {status === "all" ? "All" : IMPORT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-medium text-muted-foreground">
        Date
        <select
          value={filters.sort === "oldest" ? "oldest" : "newest"}
          onChange={(event) =>
            onChange({
              ...filters,
              sort: event.target.value as "newest" | "oldest",
            })
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </label>
    </div>
  );
}
