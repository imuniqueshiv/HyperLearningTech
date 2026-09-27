"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileStack, Loader2, Upload } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { BatchStatus, ImportJobRecord } from "@/lib/content-pipeline";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  PIPELINE_STAGE_LABELS,
  formatFileSize,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface BulkUploadPanelProps {
  target?: {
    branch: string;
    semester: string;
    subjectCode: string;
  };
  onJobsCreated?: (jobs: ImportJobRecord[]) => void;
}

interface BulkUploadResponse {
  success: boolean;
  batchId?: string;
  jobs?: ImportJobRecord[];
  created?: number;
  failed?: { filename: string; error: string }[];
  error?: string;
}

const ACCEPT_ATTRIBUTE = ACCEPTED_UPLOAD_EXTENSIONS.join(",");
const DEFAULT_CONCURRENCY = 3;

export function BulkUploadPanel({
  target,
  onJobsCreated,
}: BulkUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchStatus | null>(null);
  const [maxConcurrency, setMaxConcurrency] = useState(DEFAULT_CONCURRENCY);
  const [autoPipeline, setAutoPipeline] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    if (!batchId) return;

    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.CMS_BULK}?batchId=${encodeURIComponent(batchId!)}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as {
          success: boolean;
          batch?: BatchStatus;
        };
        if (!cancelled && response.ok && data.success && data.batch) {
          setBatch(data.batch);
        }
      } catch {
        // ignore poll errors
      }
    }

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [batchId]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("type", "bulk");
      formData.append("maxConcurrency", String(maxConcurrency));
      formData.append("autoPipeline", autoPipeline ? "true" : "false");

      if (target?.branch.trim())
        formData.append("branch", target.branch.trim());
      if (target?.semester.trim()) {
        formData.append("semester", target.semester.trim());
      }
      if (target?.subjectCode.trim()) {
        formData.append("subjectCode", target.subjectCode.trim());
      }

      const response = await fetch(API_ENDPOINTS.CMS_BULK, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as BulkUploadResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Bulk upload failed.");
      }

      setBatchId(data.batchId ?? null);
      setCreatedCount(data.created ?? data.jobs?.length ?? 0);
      if (data.jobs?.length) {
        onJobsCreated?.(data.jobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="bulk-upload"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileStack className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Bulk Upload
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Each file becomes an independent import job (never merged)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Max concurrent jobs
            <input
              type="number"
              min={1}
              max={8}
              value={maxConcurrency}
              onChange={(event) =>
                setMaxConcurrency(
                  Math.max(1, Number.parseInt(event.target.value, 10) || 1)
                )
              }
              className="mt-1.5 w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoPipeline}
              onChange={(event) => setAutoPipeline(event.target.checked)}
              className="rounded border-border"
            />
            Auto-run pipeline
          </label>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            accept={ACCEPT_ATTRIBUTE}
            onChange={handleFileChange}
            disabled={loading}
            aria-label="Bulk upload files"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-400"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Choose files
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {batchId && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <Stat label="Batch" value={batchId} mono />
            <Stat label="Created" value={String(createdCount)} />
            <Stat label="Running" value={String(batch?.running ?? 0)} />
            <Stat label="Queued" value={String(batch?.queued ?? 0)} />
            <Stat label="Completed" value={String(batch?.completed ?? 0)} />
            <Stat label="Failed" value={String(batch?.failed ?? 0)} />
            <Stat label="Cancelled" value={String(batch?.cancelled ?? 0)} />
          </div>

          <ul className="space-y-2">
            {(batch?.items ?? []).map((item) => (
              <li
                key={item.jobId}
                className="rounded-xl border border-border bg-muted/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.filename}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.jobId}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{item.status}</p>
                    <p>
                      {PIPELINE_STAGE_LABELS[item.stage] ?? item.stage} ·{" "}
                      {item.progressPercent}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.status === "failed" ? "bg-red-500" : "bg-amber-500"
                    )}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                {item.error && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {item.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!batchId && (
        <p className="mt-3 text-xs text-muted-foreground">
          Supports mixed PDFs and images. Max size per file uses the same upload
          limits ({formatFileSize(50 * 1024 * 1024)}).
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  );
}
