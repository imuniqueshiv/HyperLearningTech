"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Undo2 } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  ImportHistoryRecord,
  SaveReport,
  ValidationReport,
  WriteReport,
} from "@/lib/content-pipeline";
import {
  IMPORT_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PIPELINE_STAGE_LABELS,
  PipelineStage,
} from "@/lib/content-pipeline";

interface HistoryDetailResponse {
  success: boolean;
  record?: ImportHistoryRecord;
  failureLog?: {
    failures: Array<{
      stage: string;
      reason: string;
      stack: string | null;
      timestamp: string;
      outcome: string;
    }>;
  } | null;
  validationReport?: ValidationReport | null;
  writeReport?: WriteReport | null;
  saveReport?: SaveReport | null;
  error?: string;
}

interface ImportHistoryDetailsProps {
  jobId: string | null;
  onRecovered?: () => void;
}

function stageLabel(stage: string): string {
  return PIPELINE_STAGE_LABELS[stage as PipelineStage] ?? stage;
}

export function ImportHistoryDetails({
  jobId,
  onRecovered,
}: ImportHistoryDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoryDetailResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<
    "retry" | "rollback" | null
  >(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const activeJobId = jobId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_ENDPOINTS.CMS_HISTORY}/${encodeURIComponent(activeJobId)}`,
          { cache: "no-store" }
        );
        const json = (await response.json()) as HistoryDetailResponse;
        if (cancelled) return;
        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load history details.");
        }
        setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load details."
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function runRecovery(action: "retry" | "rollback") {
    if (!jobId) return;
    setActionLoading(action);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_RECOVERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });
      const json = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Recovery failed.");
      }
      onRecovered?.();
      const detail = await fetch(
        `${API_ENDPOINTS.CMS_HISTORY}/${encodeURIComponent(jobId)}`,
        { cache: "no-store" }
      );
      const detailJson = (await detail.json()) as HistoryDetailResponse;
      if (detail.ok && detailJson.success) {
        setData(detailJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed.");
    } finally {
      setActionLoading(null);
    }
  }

  if (!jobId) {
    return (
      <div className="border-t border-border px-5 py-6 text-sm text-muted-foreground">
        Select a history row to view reports and recovery actions.
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 border-t border-border px-5 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading details…
      </div>
    );
  }

  const record = data?.record;
  if (!record) {
    return (
      <div className="border-t border-border px-5 py-6 text-sm text-red-600 dark:text-red-400">
        {error ??
          (loading ? "Loading details…" : "History details unavailable.")}
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-border px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {record.uploadedFile}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {record.jobId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={() => void runRecovery("retry")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {actionLoading === "retry" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Retry failed stage
          </button>
          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={() => void runRecovery("rollback")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {actionLoading === "rollback" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 className="h-3.5 w-3.5" />
            )}
            Rollback save
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="mt-0.5">{IMPORT_STATUS_LABELS[record.status]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Type</dt>
          <dd className="mt-0.5">{JOB_TYPE_LABELS[record.jobType]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Stage</dt>
          <dd className="mt-0.5">{stageLabel(record.stage)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Operator</dt>
          <dd className="mt-0.5">{record.operator}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Validation</dt>
          <dd className="mt-0.5">{record.validationResult}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Writer</dt>
          <dd className="mt-0.5">{record.writerResult}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Review</dt>
          <dd className="mt-0.5">{record.reviewResult ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Save</dt>
          <dd className="mt-0.5">{record.saveResult}</dd>
        </div>
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReportCard
          title="Validation report"
          body={
            data?.validationReport
              ? `${data.validationReport.status} · ${data.validationReport.statistics.errorCount} errors · ${data.validationReport.statistics.warningCount} warnings`
              : "No validation report."
          }
        />
        <ReportCard
          title="Write report"
          body={
            data?.writeReport
              ? `${data.writeReport.status} · +${data.writeReport.questionsAdded} questions · ${data.writeReport.filesModified.length} files`
              : "No write report."
          }
        />
        <ReportCard
          title="Save / review"
          body={
            data?.saveReport
              ? `${data.saveReport.status} · ${data.saveReport.filesUpdated.length} updated · ${data.saveReport.diagramsCopied} diagrams`
              : `Review: ${record.reviewResult ?? "pending"}`
          }
        />
      </div>

      {record.lastFailure && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm">
          <p className="font-medium text-red-700 dark:text-red-400">
            Last failure · {stageLabel(String(record.lastFailure.stage))}
          </p>
          <p className="mt-1 text-red-800/80 dark:text-red-200/80">
            {record.lastFailure.reason}
          </p>
        </div>
      )}

      {data?.failureLog?.failures?.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Failure log
          </h4>
          <ul className="mt-2 space-y-2 text-sm">
            {data.failureLog.failures.map((failure, index) => (
              <li
                key={`${failure.timestamp}-${index}`}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <p className="font-medium text-foreground">
                  {stageLabel(failure.stage)} · {failure.outcome}
                </p>
                <p className="mt-0.5 text-muted-foreground">{failure.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {record.filesModified.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Files modified
          </h4>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
            {record.filesModified.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <p className="mt-2 text-sm text-foreground">{body}</p>
    </div>
  );
}
