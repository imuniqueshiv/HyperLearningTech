"use client";

import { useMemo } from "react";

import type { ImportJobRecord } from "@/lib/content-pipeline";
import { getImportSessionStatus } from "@/lib/content-pipeline";
import { cn } from "@/lib/utils";

interface PipelineSummaryProps {
  jobs: ImportJobRecord[];
}

export function PipelineSummary({ jobs }: PipelineSummaryProps) {
  const stats = useMemo(() => {
    let queued = 0;
    let running = 0;
    let reviewReady = 0;
    let completed = 0;
    let failed = 0;

    for (const job of jobs) {
      switch (getImportSessionStatus(job)) {
        case "Queued":
          queued += 1;
          break;
        case "Running":
          running += 1;
          break;
        case "Review Ready":
          reviewReady += 1;
          break;
        case "Completed":
          completed += 1;
          break;
        case "Failed":
          failed += 1;
          break;
      }
    }

    return {
      queued,
      running,
      reviewReady,
      completed,
      failed,
      total: jobs.length,
    };
  }, [jobs]);

  const cards = [
    { label: "Queued", value: stats.queued, tone: "blue" },
    { label: "Running", value: stats.running, tone: "indigo" },
    { label: "Review Ready", value: stats.reviewReady, tone: "violet" },
    { label: "Completed", value: stats.completed, tone: "emerald" },
    { label: "Failed", value: stats.failed, tone: "rose" },
  ] as const;

  return (
    <section id="dashboard" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Imports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.total} session{stats.total === 1 ? "" : "s"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card px-4 py-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tracking-tight",
                card.tone === "blue" && "text-blue-600 dark:text-blue-400",
                card.tone === "indigo" &&
                  "text-indigo-600 dark:text-indigo-400",
                card.tone === "violet" &&
                  "text-violet-600 dark:text-violet-400",
                card.tone === "emerald" &&
                  "text-emerald-600 dark:text-emerald-400",
                card.tone === "rose" && "text-rose-600 dark:text-rose-400"
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** @deprecated Prefer getImportSessionStatus from content-pipeline */
export function isReviewReady(job: ImportJobRecord): boolean {
  return getImportSessionStatus(job) === "Review Ready";
}

/** @deprecated Prefer getImportSessionStatus from content-pipeline */
export function isProcessing(job: ImportJobRecord): boolean {
  return getImportSessionStatus(job) === "Running";
}
