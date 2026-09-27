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

export function ImportHistory() {
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

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.search?.trim()) params.set("search", filters.search.trim());
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.jobType && filters.jobType !== "all") {
        params.set("jobType", filters.jobType);
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

  return (
    <section
      id="import-history"
      className="rounded-2xl border border-border bg-card"
    >
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Import History
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Permanent record of every import · {total} total
        </p>
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

      <ImportHistoryTable
        records={records}
        selectedJobId={selectedJobId}
        onSelect={setSelectedJobId}
        loading={loading}
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
