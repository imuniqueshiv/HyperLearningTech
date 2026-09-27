"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { ImportJobRecord, RebuildMode } from "@/lib/content-pipeline";
import {
  CMS_PROMPT_VERSION,
  CMS_STORAGE_PROVIDER_LABEL,
  CMS_VALIDATION_VERSION,
  PIPELINE_STAGE_LABELS,
  PipelineStage,
} from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface RebuildPanelProps {
  jobs: ImportJobRecord[];
  onJobUpdated?: (job: ImportJobRecord) => void;
  onRefresh?: () => void;
}

const MODE_OPTIONS: { value: RebuildMode; label: string }[] = [
  { value: "full", label: "Full (Gemini → Schema → Validation → Writer)" },
  { value: "structuring", label: "Only Gemini" },
  { value: "schema", label: "Only Schema Builder" },
  { value: "validation", label: "Only Validation" },
  { value: "writer", label: "Only Writer Preview" },
];

function canRebuild(job: ImportJobRecord): boolean {
  const blocked = new Set<PipelineStage>([
    PipelineStage.UPLOADED,
    PipelineStage.QUEUED,
    PipelineStage.OCR_PROCESSING,
    PipelineStage.OCR_COMPLETED,
    PipelineStage.LAYOUT_PROCESSING,
    PipelineStage.LAYOUT_COMPLETED,
    PipelineStage.DIAGRAM_EXTRACTION,
    PipelineStage.REBUILDING,
  ]);
  return !blocked.has(job.stage);
}

export function RebuildPanel({
  jobs,
  onJobUpdated,
  onRefresh,
}: RebuildPanelProps) {
  const [mode, setMode] = useState<RebuildMode>("full");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const rebuildable = useMemo(
    () => jobs.filter((job) => canRebuild(job)),
    [jobs]
  );

  const selected =
    rebuildable.find((job) => job.id === selectedId) ?? rebuildable[0] ?? null;

  const storageLabel = CMS_STORAGE_PROVIDER_LABEL;

  async function runRebuild(target: "one" | "all") {
    setLoading(true);
    setError(null);
    setLastMessage(null);

    try {
      const body =
        target === "all"
          ? { jobIds: rebuildable.map((job) => job.id), mode }
          : { jobId: selected?.id, mode };

      if (target === "one" && !selected?.id) {
        throw new Error("Select a job to rebuild.");
      }

      const response = await fetch(API_ENDPOINTS.CMS_REBUILD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
        job?: ImportJobRecord;
        summary?: ImportJobRecord["rebuild"];
        report?: {
          durationMs: number;
          rebuiltStages: string[];
          promptVersion: string;
          validationVersion: string;
        };
        succeeded?: string[];
        failed?: { jobId: string; error: string }[];
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Rebuild failed.");
      }

      if (data.job) {
        onJobUpdated?.(data.job);
        setLastMessage(
          `Rebuilt ${data.job.originalFilename} in ${data.report?.durationMs ?? data.summary?.durationMs ?? 0}ms · stages: ${(data.report?.rebuiltStages ?? data.summary?.rebuiltStages ?? []).join(", ") || "—"}`
        );
      } else {
        setLastMessage(
          `Rebuild all · ${data.succeeded?.length ?? 0} succeeded · ${data.failed?.length ?? 0} failed`
        );
      }
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rebuild failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="rebuild"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Rebuild Pipeline
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Re-run Gemini → Schema → Validation → Writer from existing OCR /
            layout / diagrams
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
          <p className="text-muted-foreground">Current Storage Provider</p>
          <p className="mt-0.5 font-medium text-foreground">{storageLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-medium text-muted-foreground sm:col-span-2">
          Job
          <select
            value={selected?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
          >
            {rebuildable.length === 0 ? (
              <option value="">No rebuildable jobs</option>
            ) : (
              rebuildable.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.originalFilename} ·{" "}
                  {PIPELINE_STAGE_LABELS[job.stage] ?? job.stage}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block text-xs font-medium text-muted-foreground">
          Stage mode
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as RebuildMode)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500/40"
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !selected}
          onClick={() => void runRebuild("one")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-700 disabled:opacity-60 dark:text-sky-400"
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Rebuild Job
        </button>
        <button
          type="button"
          disabled={loading || !selected}
          onClick={() => void runRebuild("one")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          Rebuild Selected Stage
        </button>
        <button
          type="button"
          disabled={loading || rebuildable.length === 0}
          onClick={() => void runRebuild("all")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          Rebuild All
        </button>
      </div>

      {selected?.rebuild && (
        <dl className="mt-4 grid gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Last rebuild</dt>
            <dd className="mt-0.5">{selected.rebuild.completedAt}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Duration</dt>
            <dd className="mt-0.5">{selected.rebuild.durationMs}ms</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rebuilt stages</dt>
            <dd className="mt-0.5 text-xs">
              {selected.rebuild.rebuiltStages.join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Versions</dt>
            <dd className="mt-0.5 text-xs">
              prompt {selected.rebuild.promptVersion ?? CMS_PROMPT_VERSION} ·
              validation{" "}
              {selected.rebuild.validationVersion ?? CMS_VALIDATION_VERSION}
            </dd>
          </div>
        </dl>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {lastMessage && (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
          {lastMessage}
        </p>
      )}
    </section>
  );
}
