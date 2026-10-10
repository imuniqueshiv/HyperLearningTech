/**
 * Regression coverage for distinct PYQ pipeline failure classes.
 * Synthetic geometry only — does not claim real-PDF format support.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBoundingBox } from "../../lib/content-pipeline/coordinates";
import { preferEnglishExamText } from "../../lib/content-pipeline/english-text";
import { assessExtractionQuality } from "../../lib/content-pipeline/extraction-quality";
import { buildExtractionEvidence } from "../../lib/content-pipeline/extraction-evidence";
import { detectQuestionGroups } from "../../lib/content-pipeline/question-detector";
import {
  classifyTextBlock,
  computeMedianTextHeight,
} from "../../lib/content-pipeline/block-detector";
import { sortByReadingOrder } from "../../lib/content-pipeline/reading-order";
import { buildStructuredDocument } from "../../lib/content-pipeline/structure-builder";
import {
  parseQuestionNumber,
  parseSubQuestionLabel,
} from "../../lib/content-pipeline/question-number";
import type { RawDocument } from "../../lib/content-pipeline/raw-document";
import {
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

function makeRaw(
  blocks: Array<{
    id: string;
    page: number;
    text: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
  }>,
  opts?: { width?: number; height?: number; pages?: number }
): RawDocument {
  const width = opts?.width ?? 1200;
  const height = opts?.height ?? 900;
  const pageCount = opts?.pages ?? Math.max(...blocks.map((b) => b.page), 1);
  const pages = Array.from({ length: pageCount }, (_, i) => {
    const pageNumber = i + 1;
    const textBlocks = blocks
      .filter((b) => b.page === pageNumber)
      .map((b) => ({
        id: b.id,
        pageNumber,
        text: b.text,
        bbox: createBoundingBox(b.x, b.y, b.w ?? 480, b.h ?? 28),
        confidence: 0.92,
      }));
    return {
      pageNumber,
      width,
      height,
      imagePath: null,
      text: textBlocks.map((t) => t.text).join("\n"),
      textBlocks,
      layout: { pageNumber, width, height, blocks: [] },
    };
  });
  return {
    version: 1,
    metadata: {
      jobId: "failure-class",
      sourceFilename: "synthetic.pdf",
      sourceMimeType: "application/pdf",
      pageCount,
      imageCount: 0,
      tableCount: 0,
      textBlockCount: blocks.length,
      extractedAt: new Date().toISOString(),
      engine: "synthetic",
      durationMs: 0,
    },
    pages,
    images: [],
    tables: [],
  };
}

describe("Failure class: English/Hindi separation", () => {
  it("keeps English and drops Devanagari from mixed OCR", () => {
    const cleaned = preferEnglishExamText(
      "Explain PCA. प्रमुख घटक विश्लेषण Explain MLP architecture."
    );
    assert.match(cleaned, /Explain PCA/);
    assert.match(cleaned, /Explain MLP/);
    assert.doesNotMatch(cleaned, /[\u0900-\u097F]/);
  });
});

describe("Failure class: main vs sub-question marker discrimination", () => {
  it("treats (a)/(b) as sub labels and 1./Q.1 as main", () => {
    assert.equal(parseQuestionNumber("(a) Explain"), null);
    assert.equal(parseSubQuestionLabel("(a) Explain")?.canonical, "a)");
    assert.equal(parseQuestionNumber("1. (a) Explain")?.canonical, "Q.1");
    assert.equal(parseQuestionNumber("Q.2 Explain")?.canonical, "Q.2");
    assert.equal(parseQuestionNumber("marks: 14"), null);
    assert.equal(parseQuestionNumber("June 2026"), null);
  });
});

describe("Failure class: two-column reading order without 50% blind split", () => {
  it("reads left column then right for landscape two-column page", () => {
    const width = 1400;
    const items = [];
    for (let i = 0; i < 5; i += 1) {
      items.push({
        id: `r${i}`,
        bbox: createBoundingBox(760, 40 + i * 40, 500, 20),
      });
      items.push({
        id: `l${i}`,
        bbox: createBoundingBox(40, 40 + i * 40, 500, 20),
      });
    }
    const ordered = sortByReadingOrder(items, 8, width).map((e) => e.item.id);
    const leftIdx = ordered
      .map((id, i) => (id.startsWith("l") ? i : -1))
      .filter((i) => i >= 0);
    const rightIdx = ordered
      .map((id, i) => (id.startsWith("r") ? i : -1))
      .filter((i) => i >= 0);
    assert.ok(
      Math.max(...leftIdx) < Math.min(...rightIdx),
      `expected left-before-right, got ${ordered.join(",")}`
    );
  });
});

describe("Failure class: cross-column body must not steal open sub", () => {
  it("keeps left-column (b) continuation when right-column junk intervenes", () => {
    const width = 1400;
    const height = 900;
    const median = 14;
    const specs = [
      {
        id: "q5a",
        text: "5. (a) What is Logistic Regression and Linear Regression with suitable examples.",
        x: 40,
        y: 80,
      },
      {
        id: "q5b",
        text: "(b) Explain Unsupervised Learning. Describe K-Means",
        x: 40,
        y: 140,
      },
      {
        id: "junk",
        text: "8. (a) Explain Hypothesis Testing in Machine Learning in detail.",
        x: 760,
        y: 120,
      },
      {
        id: "q5bcont",
        text: "Clustering Algorithm with its advantages.",
        x: 40,
        y: 180,
      },
    ];
    const classified = specs.map((s) =>
      classifyTextBlock({
        id: s.id,
        pageNumber: 1,
        text: s.text,
        bbox: createBoundingBox(s.x, s.y, 500, 28),
        confidence: 0.9,
        pageWidth: width,
        pageHeight: height,
        medianTextHeight: median,
      })
    );
    const ordered = sortByReadingOrder(classified, 8, width).map((e) => e.item);
    const groups = detectQuestionGroups(ordered, width);
    const q5 = groups.find((g) => /5\./.test(g.question.text));
    assert.ok(q5);
    const bodies = q5!.subQuestions.flatMap((s) =>
      s.bodyBlockIds.map((id) => ordered.find((b) => b.id === id)?.text ?? "")
    );
    assert.ok(
      bodies.some((t) => /Clustering Algorithm with its advantages/i.test(t)),
      `expected Clustering continuation under Q5; got ${JSON.stringify(bodies)}`
    );
  });
});

describe("Failure class: multi-page continuation provenance", () => {
  it("keeps page-spanning question text on one candidate with source pages", () => {
    const raw = makeRaw(
      [
        {
          id: "q1",
          page: 1,
          text: "1. (a) Explain Machine Learning scope and limitations.",
          x: 40,
          y: 80,
        },
        {
          id: "q1b",
          page: 2,
          text: "(b) Explain Hypothesis Space and Inductive Bias.",
          x: 40,
          y: 60,
        },
      ],
      { pages: 2 }
    );
    const structured = buildStructuredDocument(raw);
    const evidence = buildExtractionEvidence({ raw, structured });
    assert.equal(evidence.questionCandidates.length, 1);
    const cand = evidence.questionCandidates[0];
    assert.equal(cand.questionNumber, "Q.1");
    const joined = [cand.text, ...cand.subQuestions.map((s) => s.text)].join(
      " "
    );
    assert.match(joined, /Machine Learning/);
    assert.match(joined, /Hypothesis Space/);
    assert.ok(
      (cand.sourcePages ?? []).includes(1) ||
        (cand.sourcePages ?? []).includes(2),
      `expected sourcePages to include 1 or 2, got ${JSON.stringify(cand.sourcePages)}`
    );
  });
});

describe("Failure class: no silent discard of source question blocks", () => {
  it("surfaces every numbered opener as a candidate", () => {
    const raw = makeRaw([
      {
        id: "q1",
        page: 1,
        text: "1. (a) First question body here.",
        x: 40,
        y: 80,
      },
      {
        id: "q2",
        page: 1,
        text: "2. (a) Second question body here.",
        x: 40,
        y: 160,
      },
      {
        id: "q3",
        page: 1,
        text: "3. (a) Third question body here.",
        x: 40,
        y: 240,
      },
    ]);
    const structured = buildStructuredDocument(raw);
    const evidence = buildExtractionEvidence({ raw, structured });
    assert.equal(evidence.questionCandidates.length, 3);
    assert.deepEqual(
      evidence.questionCandidates.map((c) => c.questionIndex),
      [1, 2, 3]
    );
  });
});

describe("Failure class: extraction-quality gate vs schema PASS", () => {
  it("blocks save on duplicate numbers even when schema would PASS", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("a", "(a)", "One")]),
        makeQuestion("q1dup", "Q.1", [makeSub("b", "(a)", "Dup")]),
      ]),
    ]);
    const assessment = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
    });
    assert.equal(assessment.readiness, "BLOCKED");
    assert.equal(assessment.canSave, false);
    assert.ok(assessment.codes.includes("DUPLICATE_QUESTION_NUMBER"));
  });

  it("is idempotent — repeated assessment does not accumulate codes", () => {
    const extracted = makePyqs([
      makePaper(2026, "June", [
        makeQuestion("q1", "Q.1", [makeSub("a", "(a)", "One")]),
      ]),
    ]);
    const a = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      ocrConfidencePercent: 50,
    });
    const b = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      ocrConfidencePercent: 50,
    });
    assert.deepEqual(a.codes, b.codes);
    assert.equal(a.readiness, b.readiness);
    assert.equal(a.reasons.length, b.reasons.length);
  });
});

describe("Failure class: median text height unused import guard", () => {
  it("computeMedianTextHeight is stable for empty/short arrays", () => {
    assert.ok(Number.isFinite(computeMedianTextHeight([])));
    assert.ok(Number.isFinite(computeMedianTextHeight([10, 12, 14])));
  });
});
