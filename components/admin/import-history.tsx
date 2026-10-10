"use client";

import { useCallback, useEffect, useState } from "react";

import { ImportHistoryDetails } from "@/components/admin/import-history-details";
import { ImportHistoryFilters } from "@/components/admin/import-history-filters";
import { ImportHistoryTable } from "@/components/admin/import-history-table";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type {
  HistoryListFilters,
  ImportHistoryRecord,
} from "@/lib/content-pipeline";

interface HistoryListResponse {
  success: boolean;
  records?: ImportHistoryRecord[];
  total?: number;
  error?: string;
}

interface ImportHistoryProps {
  onDeleted?: () => void;
}

export function ImportHistory({ onDeleted }: ImportHistoryProps) {
  const [filters, setFilters] = useState<HistoryListFilters>({
    search: "",
    status: "all",
    jobType: "all",
    sort: "newest",
  });
  const [records, setRecords] = useState<ImportHistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmSingleId, setConfirmSingleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.sort) params.set("sort", filters.sort);

      const response = await fetch(
        `${API_ENDPOINTS.CMS_HISTORY}?${params.toString()}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as HistoryListResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load import history.");
      }

      setRecords(data.records ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load import history."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadHistory();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [loadHistory]);

  async function deleteIds(jobIds: string[]) {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.CMS_HISTORY, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        errors?: Array<{ jobId: string; message: string }>;
      };
      if (!response.ok && response.status !== 207) {
        throw new Error(data.error ?? "Delete failed.");
      }
      if (data.errors && data.errors.length > 0) {
        setError(data.errors.map((e) => e.message).join("; "));
      }
      setSelectedIds(new Set());
      setConfirmBulk(false);
      setConfirmSingleId(null);
      if (selectedJobId && jobIds.includes(selectedJobId)) {
        setSelectedJobId(null);
      }
      await loadHistory();
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      id="import-history"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Import History
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Clean old test sessions here · {total} total · saved content never
            deleted
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirmBulk(true)}
            className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 disabled:opacity-60"
          >
            Delete Selected ({selectedIds.size})
          </button>
        )}
      </header>

      <ImportHistoryFilters filters={filters} onChange={setFilters} />

      {error && (
        <p
          className="px-5 py-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {confirmBulk && (
        <div className="mx-5 my-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            Delete {selectedIds.size} import record
            {selectedIds.size === 1 ? "" : "s"}?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Removes CMS history/artifacts. Saved content remains untouched.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmBulk(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteIds([...selectedIds])}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {confirmSingleId && (
        <div className="mx-5 my-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Delete import history?</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {confirmSingleId}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This removes the import session and temporary processing artifacts.
            It will NOT delete saved content.
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            ✓ Saved content will remain untouched.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmSingleId(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteIds([confirmSingleId])}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <ImportHistoryTable
        records={records}
        selectedJobId={selectedJobId}
        onSelect={setSelectedJobId}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={(jobId) => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(jobId)) next.delete(jobId);
            else next.add(jobId);
            return next;
          });
        }}
        onToggleSelectAll={(checked) => {
          if (checked) {
            setSelectedIds(new Set(records.map((r) => r.jobId)));
          } else {
            setSelectedIds(new Set());
          }
        }}
        onDelete={(jobId) => setConfirmSingleId(jobId)}
        deleting={deleting}
      />

      <ImportHistoryDetails
        key={selectedJobId ?? "none"}
        jobId={selectedJobId}
        onRecovered={() => {
          void loadHistory();
        }}
      />
    </section>
  );
}
