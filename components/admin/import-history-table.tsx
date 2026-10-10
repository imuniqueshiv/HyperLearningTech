"use client";

import type { ImportHistoryRecord } from "@/lib/content-pipeline";
import {
  IMPORT_STATUS_LABELS,
  PIPELINE_STAGE_LABELS,
  PipelineStage,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ImportHistoryTableProps {
  records: ImportHistoryRecord[];
  selectedJobId: string | null;
  onSelect: (jobId: string) => void;
  loading?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (jobId: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onDelete?: (jobId: string) => void;
  deleting?: boolean;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
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

function statusClass(status: ImportHistoryRecord["status"]): string {
  switch (status) {
    case "queued":
    case "processing":
    case "awaiting_review":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
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

function stageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGE_LABELS[stage] ?? stage;
}

export function ImportHistoryTable({
  records,
  selectedJobId,
  onSelect,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  deleting,
}: ImportHistoryTableProps) {
  const allSelected =
    records.length > 0 && records.every((r) => selectedIds?.has(r.jobId));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th className="px-3 py-3 font-medium">Paper</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Duration</th>
            <th className="px-3 py-3 font-medium">Started</th>
            <th className="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-muted-foreground">
                Loading import history…
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-muted-foreground">
                No import history yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.jobId}
                className={cn(
                  "hover:bg-muted/20",
                  selectedJobId === record.jobId && "bg-muted/30"
                )}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds?.has(record.jobId))}
                    onChange={() => onToggleSelect?.(record.jobId)}
                    aria-label={`Select ${record.jobId}`}
                  />
                </td>
                <td
                  className="cursor-pointer px-3 py-3"
                  onClick={() => onSelect(record.jobId)}
                >
                  <p className="font-medium text-foreground">
                    {record.subject ? `${record.subject} · ` : ""}
                    {record.uploadedFile}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {record.jobId}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      statusClass(record.status)
                    )}
                  >
                    {IMPORT_STATUS_LABELS[record.status] ?? record.status}
                  </span>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {stageLabel(record.stage as PipelineStage)}
                  </p>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {formatDuration(record.durationMs)}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {formatDate(record.startedAt)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(record.jobId)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => onDelete?.(record.jobId)}
                      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
