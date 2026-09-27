"use client";

import { cn } from "@/lib/utils";
import type { JsonDiffResult } from "@/lib/content-pipeline";

interface DiffViewerProps {
  diff: JsonDiffResult;
  maxEntries?: number;
}

export function DiffViewer({ diff, maxEntries = 200 }: DiffViewerProps) {
  const entries = diff.entries.slice(0, maxEntries);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No differences in {diff.label}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-700 dark:text-emerald-400">
          +{diff.addedCount} added
        </span>
        <span className="text-rose-700 dark:text-rose-400">
          -{diff.removedCount} removed
        </span>
        <span className="text-amber-700 dark:text-amber-400">
          ~{diff.modifiedCount} modified
        </span>
      </div>
      <ul className="max-h-72 space-y-1 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
        {entries.map((entry, index) => (
          <li
            key={`${entry.path}-${index}`}
            className={cn(
              entry.kind === "added" &&
                "text-emerald-700 dark:text-emerald-400",
              entry.kind === "removed" && "text-rose-700 dark:text-rose-400",
              entry.kind === "modified" && "text-amber-700 dark:text-amber-400"
            )}
          >
            {entry.summary}
          </li>
        ))}
      </ul>
      {diff.entries.length > maxEntries && (
        <p className="text-xs text-muted-foreground">
          Showing {maxEntries} of {diff.entries.length} changes.
        </p>
      )}
    </div>
  );
}
