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

      {reviewPackage.extractionEvidence ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Extraction evidence
          </h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-0.5 font-medium">
                {reviewPackage.extractionEvidence.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Papers</dt>
              <dd className="mt-0.5 font-medium">
                {reviewPackage.extractionEvidence.paperCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Questions</dt>
              <dd className="mt-0.5 font-medium">
                {reviewPackage.extractionEvidence.questionCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pages</dt>
              <dd className="mt-0.5 font-medium">
                {reviewPackage.extractionEvidence.pageCount}
              </dd>
            </div>
          </dl>
          {reviewPackage.extractionEvidence.papers.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {reviewPackage.extractionEvidence.papers.map((paper) => (
                <li
                  key={paper.paperId}
                  className="border-l-2 border-muted pl-3"
                >
                  <div className="font-medium">
                    {paper.paperId}
                    {paper.subjectCode ? ` · ${paper.subjectCode}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Q count {paper.questionCount} · pages{" "}
                    {paper.sourcePages.join(", ") || "—"} ·{" "}
                    {paper.confidence.toFixed(2)} confidence
                    {paper.reviewRequired ? " · review required" : ""}
                  </div>
                  {paper.warnings.length > 0 ? (
                    <ul className="mt-1 list-disc pl-4 text-xs text-amber-700 dark:text-amber-400">
                      {paper.warnings.slice(0, 5).map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {reviewPackage.extractionEvidence.warnings.length > 0 ? (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-muted-foreground">
                Warnings
              </h4>
              <ul className="mt-1 list-disc pl-4 text-xs text-amber-700 dark:text-amber-400">
                {reviewPackage.extractionEvidence.warnings
                  .slice(0, 12)
                  .map((w) => (
                    <li key={w}>{w}</li>
                  ))}
              </ul>
            </div>
          ) : null}
          {reviewPackage.extractionEvidence.questions.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                Questions
              </h4>
              <ul className="space-y-2 text-xs">
                {reviewPackage.extractionEvidence.questions.map((q) => (
                  <li key={`${q.paperId}-${q.questionNumber}-${q.id}`}>
                    <span className="font-medium">
                      {q.paperId} Q{q.questionNumber}
                    </span>
                    {q.hasDiagram ? " · diagram" : ""}
                    {q.validationStatus ? ` · ${q.validationStatus}` : ""}
                    <div className="text-muted-foreground">
                      pages {q.sourcePages.join(", ") || "—"} ·{" "}
                      {(q.confidence * 100).toFixed(0)}%
                    </div>
                    {q.warnings.length > 0 ? (
                      <div className="text-amber-700 dark:text-amber-400">
                        {q.warnings.slice(0, 3).join("; ")}
                      </div>
                    ) : null}
                    <div className="mt-0.5 line-clamp-2 text-muted-foreground">
                      {q.textPreview}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
