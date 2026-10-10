"use client";

import { ReviewSummaryPanel } from "@/components/admin/approval-panel";
import type { ReviewPackage } from "@/lib/content-pipeline";

interface ReviewSummaryProps {
  reviewPackage: ReviewPackage | null;
  confirmDuplicateSave?: boolean;
  onConfirmDuplicateChange?: (value: boolean) => void;
}

export function ReviewSummary({
  reviewPackage,
  confirmDuplicateSave,
  onConfirmDuplicateChange,
}: ReviewSummaryProps) {
  if (!reviewPackage) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a written job and open Review to inspect diffs and reports.
      </p>
    );
  }

  return (
    <ReviewSummaryPanel
      reviewPackage={reviewPackage}
      confirmDuplicateSave={confirmDuplicateSave}
      onConfirmDuplicateChange={onConfirmDuplicateChange}
    />
  );
}
