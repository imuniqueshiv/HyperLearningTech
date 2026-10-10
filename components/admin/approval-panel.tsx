"use client";

import type { ReviewPackage } from "@/lib/content-pipeline";

interface ReviewSummaryPanelProps {
  reviewPackage: ReviewPackage;
  confirmDuplicateSave?: boolean;
  onConfirmDuplicateChange?: (value: boolean) => void;
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

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
}) {
  const className =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400"
        : tone === "bad"
          ? "text-red-700 dark:text-red-400"
          : "text-muted-foreground";
  return <span className={`font-medium ${className}`}>{label}</span>;
}

export function ReviewSummaryPanel({
  reviewPackage,
  confirmDuplicateSave = false,
  onConfirmDuplicateChange,
}: ReviewSummaryPanelProps) {
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

  const qi = reviewPackage.qualityIndicators;
  const warnings = reviewPackage.warningSummary;
  const dup = reviewPackage.duplicateDetection;
  const diagnostics = reviewPackage.diagnostics;
  const eligibility = reviewPackage.documentEligibility;
  const extractionQuality = reviewPackage.extractionQuality;
  const extractedPaperCount = (
    (reviewPackage.extractedPyqs ?? reviewPackage.productionPyqs) as {
      papers?: unknown[];
    } | null
  )?.papers?.length;
  const mergedPaperCount = (
    (reviewPackage.mergedSaveCandidate ?? reviewPackage.pendingPyqs) as {
      papers?: unknown[];
    } | null
  )?.papers?.length;

  return (
    <div className="space-y-5">
      {extractionQuality ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Extraction readiness
          </h3>
          <p className="text-sm font-medium">
            <StatusPill
              label={
                extractionQuality.readiness === "READY"
                  ? "Valid and ready"
                  : extractionQuality.readiness === "NEEDS_REVIEW"
                    ? "Valid but requires human review"
                    : "Blocked from approval/save"
              }
              tone={
                extractionQuality.readiness === "READY"
                  ? "ok"
                  : extractionQuality.readiness === "NEEDS_REVIEW"
                    ? "warn"
                    : "bad"
              }
            />
          </p>
          {extractionQuality.reasons.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {extractionQuality.reasons.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Schema validation PASS is not proof of extraction correctness.
            Extracted papers: {extractedPaperCount ?? "—"} · Merge candidate
            papers: {mergedPaperCount ?? "—"}
            {reviewPackage.pyqOnlyImport
              ? " · Syllabus unchanged (PYQ-only)"
              : ""}
          </p>
        </div>
      ) : null}

      {eligibility ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            RGPV Eligibility
          </h3>
          <p className="text-sm font-medium">
            <StatusPill
              label={eligibility.adminTitle}
              tone={
                eligibility.status === "DOCUMENT_ELIGIBILITY_PASSED"
                  ? "ok"
                  : eligibility.status === "DOCUMENT_ELIGIBILITY_REJECTED"
                    ? "bad"
                    : "warn"
              }
            />
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {eligibility.adminDetails.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {eligibility.codes.length > 0 &&
          eligibility.status !== "DOCUMENT_ELIGIBILITY_PASSED" ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {eligibility.codes.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}

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
            {reviewPackage.pyqOnlyImport
              ? "None (PYQ-only)"
              : `+${reviewPackage.syllabusDiff.addedCount} / -${reviewPackage.syllabusDiff.removedCount} / ~${reviewPackage.syllabusDiff.modifiedCount}`}
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

      {qi ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Content quality
          </h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Questions</dt>
              <dd className="mt-0.5 font-medium">{qi.questionsDetected}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Evidence coverage
              </dt>
              <dd className="mt-0.5 font-medium">
                {qi.evidenceCoveragePercent != null
                  ? `${qi.evidenceCoveragePercent}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Numeric checks</dt>
              <dd className="mt-0.5">
                <StatusPill
                  label={qi.numericChecks}
                  tone={
                    qi.numericChecks === "PASS"
                      ? "ok"
                      : qi.numericChecks === "FAIL"
                        ? "bad"
                        : qi.numericChecks === "REVIEW"
                          ? "warn"
                          : "neutral"
                  }
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Table checks</dt>
              <dd className="mt-0.5">
                <StatusPill
                  label={qi.tableChecks}
                  tone={
                    qi.tableChecks === "PASS"
                      ? "ok"
                      : qi.tableChecks === "FAIL"
                        ? "bad"
                        : qi.tableChecks === "REVIEW"
                          ? "warn"
                          : "neutral"
                  }
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Metadata</dt>
              <dd className="mt-0.5">
                <StatusPill
                  label={qi.metadata}
                  tone={
                    qi.metadata === "PASS"
                      ? "ok"
                      : qi.metadata === "FAIL"
                        ? "bad"
                        : qi.metadata === "REVIEW"
                          ? "warn"
                          : "neutral"
                  }
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OCR confidence</dt>
              <dd className="mt-0.5 font-medium">
                {qi.ocrConfidencePercent != null
                  ? `${qi.ocrConfidencePercent}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Review required</dt>
              <dd className="mt-0.5 font-medium">{qi.reviewRequiredCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Critical</dt>
              <dd className="mt-0.5 font-medium">{qi.criticalCount}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {dup ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Duplicate detection
          </h3>
          <p className="text-sm">
            <StatusPill
              label={dup.overall}
              tone={
                dup.overall === "NEW"
                  ? "ok"
                  : dup.overall === "DUPLICATE"
                    ? "bad"
                    : "warn"
              }
            />
            <span className="ml-2 text-muted-foreground">{dup.summary}</span>
          </p>
          {dup.requiresConfirmation && onConfirmDuplicateChange ? (
            <label className="mt-2 flex items-start gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmDuplicateSave}
                onChange={(e) => onConfirmDuplicateChange(e.target.checked)}
              />
              <span>
                I confirm this save despite{" "}
                {dup.isExactDuplicate ? "exact" : "possible"} duplicate paper
                identity.
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {warnings && warnings.counts.total > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Warnings · Critical {warnings.counts.critical} · Review{" "}
            {warnings.counts.reviewRequired} · Info{" "}
            {warnings.counts.informational}
          </h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
            {warnings.critical.map((w) => (
              <li
                key={`c-${w.message}`}
                className="text-red-700 dark:text-red-400"
              >
                [{w.category}] {w.message}
              </li>
            ))}
            {warnings.reviewRequired.map((w) => (
              <li
                key={`r-${w.message}`}
                className="text-amber-700 dark:text-amber-400"
              >
                [{w.category}] {w.message}
              </li>
            ))}
            {warnings.informational.slice(0, 8).map((w) => (
              <li key={`i-${w.message}`} className="text-muted-foreground">
                [{w.category}] {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {diagnostics ? (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Import diagnostics
          </h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Duration</dt>
              <dd className="mt-0.5 font-medium">
                {diagnostics.totalDurationMs != null
                  ? `${(diagnostics.totalDurationMs / 1000).toFixed(1)}s`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pages</dt>
              <dd className="mt-0.5 font-medium">
                {diagnostics.pageCount ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OCR</dt>
              <dd className="mt-0.5 font-medium">
                {diagnostics.ocrDurationMs != null
                  ? `${(diagnostics.ocrDurationMs / 1000).toFixed(1)}s`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Gemini</dt>
              <dd className="mt-0.5 font-medium">
                {diagnostics.geminiDurationMs != null
                  ? `${(diagnostics.geminiDurationMs / 1000).toFixed(1)}s`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

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
            Source evidence
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
          {reviewPackage.extractionEvidence.questions.length > 0 ? (
            <div className="mt-3 max-h-72 overflow-y-auto">
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                Question → source mapping
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
                      {(q.confidence * 100).toFixed(0)}% OCR
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
