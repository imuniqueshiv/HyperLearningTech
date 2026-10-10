/**
 * Objective content-quality indicators for Review Center.
 * Not an AI-generated quality score — only measured pipeline facts.
 */

import type { DuplicatePaperReport } from "./duplicate-paper-detector";
import type { WarningSummary } from "./warning-catalog";

export interface ContentQualityIndicators {
  questionsDetected: number;
  evidenceCoveragePercent: number | null;
  numericChecks: "PASS" | "FAIL" | "REVIEW" | "N/A";
  tableChecks: "PASS" | "FAIL" | "REVIEW" | "N/A";
  metadata: "PASS" | "FAIL" | "REVIEW" | "N/A";
  ocrConfidencePercent: number | null;
  reviewRequiredCount: number;
  criticalCount: number;
  paperCount: number;
  pageCount: number;
  duplicateStatus: DuplicatePaperReport["overall"] | "UNKNOWN";
  reviewDecision: string | null;
}

export function buildContentQualityIndicators(input: {
  questionCount: number;
  paperCount: number;
  pageCount: number;
  questionsWithPages: number;
  ocrConfidenceAvg: number | null;
  warningSummary: WarningSummary;
  numericChecks?: "PASS" | "FAIL" | "REVIEW" | "N/A";
  tableChecks?: "PASS" | "FAIL" | "REVIEW" | "N/A";
  metadata?: "PASS" | "FAIL" | "REVIEW" | "N/A";
  duplicate?: DuplicatePaperReport | null;
  reviewDecision?: string | null;
}): ContentQualityIndicators {
  const coverage =
    input.questionCount > 0
      ? Math.round(
          (100 * Math.min(input.questionsWithPages, input.questionCount)) /
            input.questionCount
        )
      : null;

  return {
    questionsDetected: input.questionCount,
    evidenceCoveragePercent: coverage,
    numericChecks: input.numericChecks ?? "N/A",
    tableChecks: input.tableChecks ?? "N/A",
    metadata: input.metadata ?? "N/A",
    ocrConfidencePercent:
      input.ocrConfidenceAvg != null
        ? Math.round(input.ocrConfidenceAvg * 1000) / 10
        : null,
    reviewRequiredCount: input.warningSummary.counts.reviewRequired,
    criticalCount: input.warningSummary.counts.critical,
    paperCount: input.paperCount,
    pageCount: input.pageCount,
    duplicateStatus: input.duplicate?.overall ?? "UNKNOWN",
    reviewDecision: input.reviewDecision ?? null,
  };
}

/**
 * Infer numeric/table/metadata status from categorized warning codes.
 */
export function inferCheckStatuses(warningSummary: WarningSummary): {
  numericChecks: ContentQualityIndicators["numericChecks"];
  tableChecks: ContentQualityIndicators["tableChecks"];
  metadata: ContentQualityIndicators["metadata"];
} {
  const all = [
    ...warningSummary.critical,
    ...warningSummary.reviewRequired,
    ...warningSummary.informational,
  ];

  const has = (re: RegExp) =>
    all.some((w) => re.test(w.code) || re.test(w.message));

  const criticalNumeric = warningSummary.critical.some(
    (w) => /NUMERIC|NUMBER_FIDELITY/i.test(w.code) || /NUMERIC/i.test(w.message)
  );
  const reviewNumeric = has(/NUMERIC|NUMBER_FIDELITY/i);
  const criticalTable = warningSummary.critical.some((w) =>
    /TABLE/i.test(w.code)
  );
  const reviewTable = has(/TABLE/i);
  const criticalMeta = warningSummary.critical.some((w) =>
    /METADATA/i.test(w.code)
  );
  const reviewMeta = has(/METADATA/i);

  return {
    numericChecks: criticalNumeric
      ? "FAIL"
      : reviewNumeric
        ? "REVIEW"
        : all.length === 0
          ? "N/A"
          : "PASS",
    tableChecks: criticalTable
      ? "FAIL"
      : reviewTable
        ? "REVIEW"
        : all.length === 0
          ? "N/A"
          : "PASS",
    metadata: criticalMeta
      ? "FAIL"
      : reviewMeta
        ? "REVIEW"
        : all.length === 0
          ? "N/A"
          : "PASS",
  };
}
