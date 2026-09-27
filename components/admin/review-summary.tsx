"use client";

import { ReviewSummaryPanel } from "@/components/admin/approval-panel";
import type { ReviewPackage } from "@/lib/content-pipeline";

interface ReviewSummaryProps {
  reviewPackage: ReviewPackage | null;
}

export function ReviewSummary({ reviewPackage }: ReviewSummaryProps) {
  if (!reviewPackage) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a written job and open Review to inspect diffs and reports.
      </p>
    );
  }

  return <ReviewSummaryPanel reviewPackage={reviewPackage} />;
}
