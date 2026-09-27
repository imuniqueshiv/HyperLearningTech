"use client";

import type { ReviewPackage } from "@/lib/content-pipeline";

interface ReviewSummaryPanelProps {
  reviewPackage: ReviewPackage;
}

function fieldNote(
  extracted:
    | {
        confidence?: number;
        source?: string | null;
        needsConfirmation?: boolean;
      }
    | null
    | undefined
): string {
  if (!extracted?.source) return "";
  const pct = Math.round((extracted.confidence ?? 0) * 100);
  const confirm = extracted.needsConfirmation ? " · needs confirmation" : "";
  return `${extracted.source} ${pct}%${confirm}`;
}

export function ReviewSummaryPanel({ reviewPackage }: ReviewSummaryPanelProps) {
  const metadataRows = [
    {
      label: "Branch",
      value: reviewPackage.branch,
      extracted: reviewPackage.extractedMetadata?.branch,
    },
    {
      label: "Semester",
      value: reviewPackage.semester,
      extracted: reviewPackage.extractedMetadata?.semester,
    },
    {
      label: "Subject",
      value: reviewPackage.subjectCode,
      extracted: reviewPackage.extractedMetadata?.subjectCode,
    },
    {
      label: "Year",
      value: reviewPackage.year != null ? String(reviewPackage.year) : null,
      extracted: reviewPackage.extractedMetadata?.year,
    },
    {
      label: "Session",
      value: reviewPackage.examSession,
      extracted: reviewPackage.extractedMetadata?.examSession,
    },
  ];

  return (
    <div className="space-y-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Stage</dt>
          <dd className="mt-0.5 font-medium">{reviewPackage.stage}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="mt-0.5 font-medium">{reviewPackage.status}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">PYQ changes</dt>
          <dd className="mt-0.5">
            +{reviewPackage.pyqsDiff.addedCount} / -
            {reviewPackage.pyqsDiff.removedCount} / ~
            {reviewPackage.pyqsDiff.modifiedCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Syllabus changes</dt>
          <dd className="mt-0.5">
            +{reviewPackage.syllabusDiff.addedCount} / -
            {reviewPackage.syllabusDiff.removedCount} / ~
            {reviewPackage.syllabusDiff.modifiedCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Decision</dt>
          <dd className="mt-0.5">{reviewPackage.review?.decision ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Target</dt>
          <dd className="mt-0.5 font-mono text-xs">
            {reviewPackage.contentDir ?? "—"}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Extracted metadata
        </h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {metadataRows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="mt-0.5 font-medium">{row.value ?? "—"}</dd>
              <dd className="text-[11px] text-muted-foreground">
                {fieldNote(row.extracted)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
