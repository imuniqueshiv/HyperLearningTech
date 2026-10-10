/**
 * Phase 3 acceptance tests — duplicate detection, warning taxonomy,
 * quality indicators, one-paper save gates (offline, no OCR/Gemini).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildContentQualityIndicators,
  inferCheckStatuses,
} from "../../lib/content-pipeline/content-quality-indicators";
import {
  detectDuplicatePapers,
  paperContentIdentityHash,
} from "../../lib/content-pipeline/duplicate-paper-detector";
import {
  categorizeWarning,
  summarizeWarnings,
} from "../../lib/content-pipeline/warning-catalog";
import {
  fixtureDuplicate2023December,
  fixtureExisting2022_2023,
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

describe("Phase 3 duplicate paper detection", () => {
  it("classifies NEW when no overlapping exam identity", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = makePyqs([
      makePaper(2024, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "New content.")]),
      ]),
    ]);
    const report = detectDuplicatePapers(existing, incoming);
    assert.equal(report.overall, "NEW");
    assert.equal(report.requiresConfirmation, false);
  });

  it("classifies DUPLICATE for exact content re-import", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = fixtureDuplicate2023December();
    const report = detectDuplicatePapers(existing, incoming);
    assert.equal(report.overall, "DUPLICATE");
    assert.equal(report.requiresConfirmation, true);
    assert.equal(report.isExactDuplicate, true);
    assert.equal(report.papers[0]?.contentHashMatch, true);
  });

  it("classifies POSSIBLE_DUPLICATE for same identity different content", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = makePyqs([
      makePaper(2023, "December", [
        makeQuestion("q1", "Q.1", [
          makeSub("q1a", "a)", "Completely different wording for TCP."),
        ]),
        makeQuestion("q2", "Q.2", [
          makeSub("q2a", "a)", "Extra question not in existing."),
        ]),
      ]),
    ]);
    const report = detectDuplicatePapers(existing, incoming);
    assert.equal(report.overall, "POSSIBLE_DUPLICATE");
    assert.equal(report.requiresConfirmation, true);
    assert.equal(report.isExactDuplicate, false);
    assert.equal(report.papers[0]?.contentHashMatch, false);
  });

  it("produces stable content hashes", () => {
    const paper = makePaper(2023, "December", [
      makeQuestion("q1", "Q.1", [
        makeSub("q1a", "a)", "Explain TCP congestion control."),
      ]),
    ]);
    const a = paperContentIdentityHash(paper);
    const b = paperContentIdentityHash(structuredClone(paper));
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });
});

describe("Phase 3 warning catalog", () => {
  it("categorizes OCR and numeric codes", () => {
    const ocr = categorizeWarning("OCR_LOW_CONFIDENCE: page 2 mean 0.41");
    assert.equal(ocr.category, "OCR");
    assert.equal(ocr.severity, "review_required");

    const numeric = categorizeWarning(
      "NUMERIC_EVIDENCE_MISMATCH: 5.6 not in evidence"
    );
    assert.equal(numeric.category, "Numbers");
    assert.equal(numeric.severity, "review_required");
  });

  it("treats merged PDF / limits as critical", () => {
    const merged = categorizeWarning("MERGED_PDF_UNSUPPORTED");
    assert.equal(merged.severity, "critical");
    assert.equal(merged.category, "Input");
  });

  it("summarizes counts without duplicates", () => {
    const summary = summarizeWarnings([
      "OCR_LOW_CONFIDENCE: a",
      "OCR_LOW_CONFIDENCE: a",
      "TABLE_AMBIGUOUS: irregular cells",
      "MERGED_PDF_UNSUPPORTED",
      "DIAGRAM_PRESENT on Q.3",
    ]);
    assert.equal(summary.counts.critical, 1);
    assert.equal(summary.counts.reviewRequired, 2);
    assert.equal(summary.counts.informational, 1);
    assert.equal(summary.counts.total, 4);
  });
});

describe("Phase 3 content quality indicators", () => {
  it("builds objective indicators from measured inputs", () => {
    const warningSummary = summarizeWarnings([
      "OCR_LOW_CONFIDENCE: page 1",
      "NUMERIC_EVIDENCE_MISMATCH: 220 V",
    ]);
    const checks = inferCheckStatuses(warningSummary);
    assert.equal(checks.numericChecks, "REVIEW");

    const qi = buildContentQualityIndicators({
      questionCount: 10,
      paperCount: 1,
      pageCount: 3,
      questionsWithPages: 10,
      ocrConfidenceAvg: 0.94,
      warningSummary,
      ...checks,
      duplicate: detectDuplicatePapers(
        null,
        makePyqs([makePaper(2024, "June", [])])
      ),
      reviewDecision: null,
    });

    assert.equal(qi.questionsDetected, 10);
    assert.equal(qi.evidenceCoveragePercent, 100);
    assert.equal(qi.ocrConfidencePercent, 94);
    assert.equal(qi.paperCount, 1);
    assert.equal(qi.numericChecks, "REVIEW");
    assert.equal(qi.duplicateStatus, "NEW");
  });
});

describe("Phase 3 one-paper contract helpers", () => {
  it("incoming fixture always has papers.length === 1 for single-paper fixtures", () => {
    const dup = fixtureDuplicate2023December();
    assert.equal(dup.papers.length, 1);
    const report = detectDuplicatePapers(fixtureExisting2022_2023(), dup);
    assert.equal(report.papers.length, 1);
  });
});
