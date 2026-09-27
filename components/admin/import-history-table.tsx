"use client";

import type { ImportHistoryRecord } from "@/lib/content-pipeline";
import {
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PIPELINE_STAGE_LABELS,
  PipelineStage,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface ImportHistoryTableProps {
  records: ImportHistoryRecord[];
  selectedJobId: string | null;
  onSelect: (jobId: string) => void;
  loading?: boolean;
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
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "processing":
    case "awaiting_review":
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

function stageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGE_LABELS[stage] ?? stage;
}

export function ImportHistoryTable({
  records,
  selectedJobId,
  onSelect,
  loading,
}: ImportHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-medium">File</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Stage</th>
            <th className="px-5 py-3 font-medium">Duration</th>
            <th className="px-5 py-3 font-medium">Imported</th>
            <th className="px-5 py-3 font-medium">Errors</th>
            <th className="px-5 py-3 font-medium">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-muted-foreground">
                Loading import history…
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-muted-foreground">
                No import history yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.jobId}
                className={cn(
                  "cursor-pointer hover:bg-muted/20",
                  selectedJobId === record.jobId && "bg-muted/30"
                )}
                onClick={() => onSelect(record.jobId)}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-foreground">
                    {record.uploadedFile}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {record.jobId}
                  </p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {JOB_TYPE_LABELS[record.jobType]}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                      statusClass(record.status)
                    )}
                  >
                    {IMPORT_STATUS_LABELS[record.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {stageLabel(record.stage)}
                  <span className="mt-0.5 block text-xs">
                    {record.progressPercent}%
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {formatDuration(record.durationMs)}
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  Q {record.questionsImported} · T {record.topicsImported} · D{" "}
                  {record.diagramsImported}
                </td>
                <td className="px-5 py-3">
                  <span className="text-red-600 dark:text-red-400">
                    {record.errors}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    / {record.warnings} warn
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {formatDate(record.startedAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
