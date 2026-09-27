"use client";

import { Check, GitBranch, Loader2, Save } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewToolbarProps {
  busy?: boolean;
  canStart?: boolean;
  canDecide?: boolean;
  canSave?: boolean;
  canRefreshGit?: boolean;
  onStart: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
  onLocalSave: () => void;
  onRefreshGit: () => void;
}

export function ReviewToolbar({
  busy,
  canStart,
  canDecide,
  canSave,
  canRefreshGit,
  onStart,
  onApprove,
  onReject,
  onRequestChanges,
  onLocalSave,
  onRefreshGit,
}: ReviewToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !canStart}
          onClick={onStart}
          className={cn(
            "inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Review
        </button>
        <button
          type="button"
          disabled={busy || !canDecide}
          onClick={onApprove}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-50 dark:text-emerald-300"
        >
          <Check className="h-4 w-4" />
          Approve
        </button>
        <button
          type="button"
          disabled={busy || !canSave}
          onClick={onLocalSave}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-800 disabled:opacity-50 dark:text-sky-300"
        >
          <Save className="h-4 w-4" />
          Local Save
        </button>
        <button
          type="button"
          disabled={busy || !canRefreshGit}
          onClick={onRefreshGit}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground disabled:opacity-50"
        >
          <GitBranch className="h-4 w-4" />
          Git Diff
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !canDecide}
          onClick={onReject}
          className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-800 disabled:opacity-50 dark:text-rose-300"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={busy || !canDecide}
          onClick={onRequestChanges}
          className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-800 disabled:opacity-50 dark:text-amber-300"
        >
          Request Changes
        </button>
      </div>
    </div>
  );
}
