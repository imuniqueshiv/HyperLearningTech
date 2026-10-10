/**
 * Review / save data-integrity regressions:
 * - extracted preview is one paper
 * - merged candidate preserves history
 * - PYQ-only must not mutate syllabus
 * - schema PASS ≠ approval-ready
 * - quality gates block corrupted extraction
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessExtractionQuality,
  parseDeclaredQuestionTotal,
} from "../../lib/content-pipeline/extraction-quality";
import { mergeProductionContent } from "../../lib/content-pipeline/merge-service";
import { emptyJsonDiff } from "../../lib/content-pipeline/diff-service";
import { detectQuestionGroups } from "../../lib/content-pipeline/question-detector";
import {
  parseSubQuestionLabel,
  splitOcrBlockIntoMarkerSegments,
  splitTextByQuestionMarkers,
} from "../../lib/content-pipeline/question-number";
import { summarizeWarnings } from "../../lib/content-pipeline/warning-catalog";
import {
  fixtureExisting2022_2023,
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

describe("extracted vs merged data separation", () => {
  it("extracted preview contains exactly one paper", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "PCA steps.")]),
        makeQuestion("q5", "Q.5", [
          makeSub("q5a", "a)", "Logistic regression."),
        ]),
      ]),
    ]);
    assert.equal(extracted.papers.length, 1);
    assert.equal(extracted.papers[0].year, 2026);
  });

  it("June 2026 import cannot inherit questions from 2022–2025", () => {
    const existing = fixtureExisting2022_2023();
    const incoming = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [
          makeSub("q1a", "a)", "Explain PCA for June 2026 only."),
        ]),
      ]),
    ]);
    const merged = mergeProductionContent({
      existingPyqs: existing,
      incomingPyqs: incoming,
      existingSyllabus: null,
      incomingSyllabus: null,
    });
    assert.ok(merged.pyqs);
    const june2026 = merged.pyqs!.papers.find(
      (p) => p.year === 2026 && /june/i.test(p.month)
    );
    assert.ok(june2026);
    assert.equal(june2026!.questions.length, 1);
    assert.match(june2026!.questions[0].subQuestions[0].text, /2026 only/);
    // Historical papers remain
    assert.ok(merged.pyqs!.papers.some((p) => p.year === 2022));
    assert.ok(merged.pyqs!.papers.some((p) => p.year === 2023));
  });

  it("merged save candidate preserves history and adds new paper once", () => {
    const existing = fixtureExisting2022_2023();
    const before = existing.papers.length;
    const incoming = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "New paper.")]),
      ]),
    ]);
    const first = mergeProductionContent({
      existingPyqs: existing,
      incomingPyqs: incoming,
      existingSyllabus: null,
      incomingSyllabus: null,
    });
    assert.equal(first.pyqStats.papersAdded, 1);
    assert.equal(first.pyqs!.papers.length, before + 1);

    // Re-merge same paper — idempotent (no second append)
    const second = mergeProductionContent({
      existingPyqs: first.pyqs,
      incomingPyqs: incoming,
      existingSyllabus: null,
      incomingSyllabus: null,
    });
    assert.equal(second.pyqStats.papersAdded, 0);
    assert.equal(second.pyqs!.papers.length, before + 1);
  });

  it("does not mutate existing pyqs object by reference", () => {
    const existing = fixtureExisting2022_2023();
    const snapshot = JSON.stringify(existing);
    const incoming = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "x")]),
      ]),
    ]);
    mergeProductionContent({
      existingPyqs: existing,
      incomingPyqs: incoming,
      existingSyllabus: null,
      incomingSyllabus: null,
    });
    assert.equal(JSON.stringify(existing), snapshot);
  });
});

describe("PYQ-only syllabus isolation", () => {
  it("merge returns null syllabus when no incoming syllabus", () => {
    const existingSyllabus = {
      subject: {
        id: "al-405",
        code: "AL-405",
        name: "Machine Learning",
        branch: "aiml",
        semester: 4,
      },
      modules: [
        {
          id: "m1",
          number: 1,
          title: "Unit 1",
          topics: ["Topic A", "Topic B"],
        },
      ],
    };
    const result = mergeProductionContent({
      existingPyqs: fixtureExisting2022_2023(),
      incomingPyqs: makePyqs([
        makePaper(2026, "June", [
          makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "x")]),
        ]),
      ]),
      existingSyllabus: existingSyllabus as never,
      incomingSyllabus: null,
    });
    assert.equal(result.syllabus, null);
    assert.equal(result.syllabusStats.topicsAdded, 0);
    assert.equal(result.syllabusStats.modulesAdded, 0);
  });

  it("empty syllabus diff helper has zero changes", () => {
    const diff = emptyJsonDiff("syllabus.json (unchanged — PYQ-only import)");
    assert.equal(diff.entries.length, 0);
    assert.equal(diff.modifiedCount, 0);
  });
});

describe("extraction quality gates", () => {
  it("corrupted extraction is BLOCKED even when schema would PASS", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [
          makeSub(
            "q1b",
            "b)",
            "Explain he: rchiecure of Multiaver Percepon Ln Enrolment No."
          ),
        ]),
        makeQuestion("q5", "Q.5", [
          makeSub("q5a", "a)", "Whatis Logistic Regression"),
        ]),
        makeQuestion("q6", "Q.6", [
          makeSub("q6a", "a)", "FIR & Tm Terie sik clustering"),
        ]),
        makeQuestion("q7", "Q.7", [
          makeSub("q7a", "a)", "wf aft wv oF Rms experiments"),
        ]),
      ]),
    ]);
    const assessment = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      ocrTexts: ["Total No. of Questions : 8"],
    });
    assert.equal(assessment.readiness, "BLOCKED");
    assert.equal(assessment.canApprove, false);
    assert.ok(assessment.codes.includes("QUESTION_NUMBER_GAP"));
    assert.ok(assessment.codes.includes("QUESTION_COUNT_BELOW_DECLARED"));
    assert.ok(assessment.codes.includes("OCR_CORRUPTION_SUSPECTED"));
  });

  it("structure-sound extraction with OCR chrome is NEEDS_REVIEW not READY", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [
          makeSub("q1a", "a)", "Explain Machine Learning scope."),
          makeSub("q1b", "b)", "Explain Hypothesis Space. Enrolment No."),
        ]),
        makeQuestion("q2", "Q.2", [
          makeSub("q2a", "a)", "Explain PCA."),
          makeSub("q2b", "b)", "Explain Multilayer Perceptron."),
        ]),
        makeQuestion("q3", "Q.3", [
          makeSub("q3a", "a)", "Vanishing gradients."),
          makeSub("q3b", "b)", "ID3 or CART."),
        ]),
        makeQuestion("q4", "Q.4", [
          makeSub("q4a", "a)", "Naive Bayes."),
          makeSub("q4b", "b)", "Random Forest."),
        ]),
        makeQuestion("q5", "Q.5", [
          makeSub("q5a", "a)", "Logistic Regression."),
          makeSub("q5b", "b)", "K-Means."),
        ]),
        makeQuestion("q6", "Q.6", [
          makeSub("q6a", "a)", "Agglomerative clustering."),
          makeSub("q6b", "b)", "GMM and EM."),
        ]),
        makeQuestion("q7", "Q.7", [
          makeSub("q7a", "a)", "Design of ML experiments."),
          makeSub("q7b", "b)", "Cross-Validation."),
        ]),
        makeQuestion("q8", "Q.8", [
          makeSub("q8a", "a)", "Hypothesis Testing."),
          makeSub("q8b", "b)", "Accuracy Precision Recall F1."),
        ]),
      ]),
    ]);
    const assessment = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      ocrTexts: ["Total No. of Questions : 8"],
    });
    assert.equal(assessment.readiness, "NEEDS_REVIEW");
    assert.equal(assessment.questionCount, 8);
    assert.equal(assessment.declaredQuestionTotal, 8);
    assert.ok(!assessment.codes.includes("OCR_CORRUPTION_SUSPECTED"));
  });

  it("legitimate incomplete formats without severe gaps are not hard-blocked for count alone", () => {
    // A paper with Q.1 and Q.2 only — no internal gaps — not forced to 8.
    const extracted = makePyqs([
      makePaper(2024, "June", [
        makeQuestion("q1", "Q.1", [
          makeSub("q1a", "a)", "Clean question text about networks."),
        ]),
        makeQuestion("q2", "Q.2", [
          makeSub("q2a", "a)", "Another clean question about routing."),
        ]),
      ]),
    ]);
    const assessment = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      warningSummary: summarizeWarnings([]),
    });
    assert.notEqual(assessment.readiness, "BLOCKED");
    assert.equal(assessment.canApprove, true);
    assert.equal(assessment.declaredQuestionTotal, null);
  });

  it("parses declared question total from OCR banner", () => {
    assert.equal(
      parseDeclaredQuestionTotal([
        "[2] Total No. of Questions : 8] { Total No. of Printed Pages : 4",
      ]),
      8
    );
  });

  it("repeated assessment is stable (no accumulating warnings)", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("q1a", "a)", "ok")]),
        makeQuestion("q3", "Q.3", [makeSub("q3a", "a)", "ok")]),
      ]),
    ]);
    const a = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
    });
    const b = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
    });
    assert.deepEqual(a.codes, b.codes);
    assert.equal(a.gapCount, b.gapCount);
  });
});

describe("question marker splitting from packed OCR", () => {
  it("splits mid-blob 2. (a) / 3. (a) markers without inventing text", () => {
    const packed =
      "Total No. of Questions : 8 2. (a) Explain Principal Component Analysis (PCA). 3. (a) What are Vanishing Gradient problems in detail?";
    const parts = splitTextByQuestionMarkers(packed);
    assert.ok(parts.length >= 2);
    assert.ok(parts.some((p) => /^2\./.test(p.trim())));
    assert.ok(parts.some((p) => /^3\./.test(p.trim())));
    assert.ok(parts.every((p) => packed.includes(p.slice(0, 20))));
  });

  it("keeps 2. (a) intact and splits trailing (b) on instruction bleed lines", () => {
    const intact = splitOcrBlockIntoMarkerSegments(
      "2. (a) Explain Principal Component Analysis (PCA) with steps"
    );
    assert.equal(intact.length, 1);
    assert.match(intact[0].text, /^2\.\s*\(a\)/);

    const bleed = splitOcrBlockIntoMarkerSegments(
      "(iii) In case of any doubt or dispute the English version (b) Describe the working of ID3 or CART"
    );
    assert.ok(bleed.some((p) => /^\(b\)/.test(p.text)));
    assert.equal(parseSubQuestionLabel("B.Tech. IV Semester"), null);
    assert.ok(parseSubQuestionLabel("() Explain Gaussian Mixture Model"));
  });

  it("pairs cross-column (b) parts by geometry, not raw scan order", () => {
    const pageWidth = 1200;
    const groups = detectQuestionGroups(
      [
        {
          id: "q5",
          pageNumber: 1,
          kind: "question",
          text: "5. (a) What is Logistic Regression",
          bbox: { x: 40, y: 40, width: 500, height: 24 },
        },
        {
          id: "q8",
          pageNumber: 1,
          kind: "question",
          text: "8 (a) Explain Hypothesis Testing",
          bbox: { x: 640, y: 40, width: 500, height: 24 },
        },
        {
          id: "b8",
          pageNumber: 1,
          kind: "sub_question",
          text: "(b) Discuss Accuracy, Precision, Recall and F1-Score.",
          bbox: { x: 200, y: 120, width: 900, height: 24 },
        },
        {
          id: "b5",
          pageNumber: 1,
          kind: "sub_question",
          text: "(b) Explain Unsupervised Learning. Describe K-Means",
          bbox: { x: 80, y: 170, width: 1000, height: 24 },
        },
      ],
      pageWidth
    );
    const q5 = groups.find((g) => /5\./.test(g.question.text));
    const q8 = groups.find((g) => /8\s*\(a\)/.test(g.question.text));
    assert.ok(q5 && q8);
    assert.equal(q5.subQuestions.length, 1);
    assert.equal(q8.subQuestions.length, 1);
    assert.match(q5.subQuestions[0].block.text, /Unsupervised/i);
    assert.match(q8.subQuestions[0].block.text, /Accuracy/i);
  });
});
