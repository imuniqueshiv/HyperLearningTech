/**
 * AL-405 June 2026 golden reconstruction tests.
 *
 * Tier A — deterministic: synthetic OCR geometry with exact English wording
 *          through structure-builder + extraction-evidence (no Gemini).
 * Tier B — real scanned PDF through local OCR → layout → evidence.
 *          Hierarchy must match; exact wording is asserted honestly
 *          (fails if OCR cannot recover English verbatim — not silenced).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { buildExtractionEvidence } from "../../lib/content-pipeline/extraction-evidence";
import { LocalOcrEngine } from "../../lib/content-pipeline/local-ocr-engine";
import { preferEnglishExamText } from "../../lib/content-pipeline/english-text";
import { buildStructuredDocument } from "../../lib/content-pipeline/structure-builder";
import type { RawDocument } from "../../lib/content-pipeline/raw-document";
import { createBoundingBox } from "../../lib/content-pipeline/coordinates";
import {
  containsIndicScript,
  latinScriptRatio,
} from "../../lib/content-pipeline/english-text";
import { assessExtractionQuality } from "../../lib/content-pipeline/extraction-quality";
import {
  makePaper,
  makePyqs,
  makeQuestion,
  makeSub,
} from "./fixtures/pyqs-fixtures";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, "fixtures", "al405-jun-2026");
const PDF_PATH = path.join(FIXTURE_DIR, "al-405-machine-learning-jun-2026.pdf");
const GOLDEN_PATH = path.join(FIXTURE_DIR, "golden-english.json");

interface GoldenPaper {
  subjectCode: string;
  year: number;
  month: string;
  declaredQuestionTotal: number;
  questions: Array<{
    questionNumber: string;
    subQuestions: Array<{ label: string; text: string }>;
  }>;
}

function loadGolden(): GoldenPaper {
  return JSON.parse(fs.readFileSync(GOLDEN_PATH, "utf8")) as GoldenPaper;
}

function norm(text: string): string {
  return preferEnglishExamText(text).replace(/\s+/g, " ").trim();
}

function labelKey(label: string): string {
  return label.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

describe("AL-405 English text helpers", () => {
  it("strips Devanagari without inventing English", () => {
    const mixed =
      "Explain Machine Learning. मशीन लर्निंग Explain Hypothesis Space.";
    const cleaned = preferEnglishExamText(mixed);
    assert.equal(containsIndicScript(cleaned), false);
    assert.match(cleaned, /Explain Machine Learning/);
    assert.match(cleaned, /Explain Hypothesis Space/);
    assert.ok(latinScriptRatio(cleaned) > 0.8);
  });
});

describe("AL-405 golden — deterministic structure from exact English OCR", () => {
  it("reconstructs Q.1–Q.8 with exact (a)/(b) wording and parents", () => {
    const golden = loadGolden();
    const pageWidth = 1200;
    const pageHeight = 900;
    const textBlocks: RawDocument["pages"][number]["textBlocks"] = [
      {
        id: "banner",
        pageNumber: 1,
        text: "Total No. of Questions : 8  AL405 (GS) Examination, June 2026",
        bbox: createBoundingBox(40, 20, 1100, 20),
      },
    ];

    let y = 80;
    for (let i = 0; i < golden.questions.length; i += 1) {
      const q = golden.questions[i];
      const index = i + 1;
      const left = index % 2 === 1;
      const x = left ? 40 : 620;
      const a = q.subQuestions.find((s) => labelKey(s.label).startsWith("a"));
      const b = q.subQuestions.find((s) => labelKey(s.label).startsWith("b"));
      assert.ok(a && b);
      textBlocks.push({
        id: `q${index}a`,
        pageNumber: 1,
        text: `${index}. (a) ${a.text}`,
        bbox: createBoundingBox(x, y, 520, 36),
      });
      textBlocks.push({
        id: `q${index}b`,
        pageNumber: 1,
        text: `(b) ${b.text}`,
        bbox: createBoundingBox(x, y + 44, 520, 36),
      });
      if (!left) y += 110;
    }

    const raw: RawDocument = {
      version: 1,
      metadata: {
        jobId: "golden-al405-synthetic",
        sourceFilename: "al-405-machine-learning-jun-2026.pdf",
        sourceMimeType: "application/pdf",
        pageCount: 1,
        imageCount: 0,
        tableCount: 0,
        textBlockCount: textBlocks.length,
        extractedAt: new Date().toISOString(),
        engine: "synthetic-golden",
        durationMs: 0,
      },
      pages: [
        {
          pageNumber: 1,
          width: pageWidth,
          height: pageHeight,
          imagePath: null,
          text: textBlocks.map((b) => b.text).join("\n"),
          textBlocks,
          layout: {
            pageNumber: 1,
            width: pageWidth,
            height: pageHeight,
            blocks: [],
          },
        },
      ],
      images: [],
      tables: [],
    };

    const structured = buildStructuredDocument(raw);
    const evidence = buildExtractionEvidence({ raw, structured });
    assert.equal(evidence.questionCandidates.length, 8);

    for (let i = 0; i < 8; i += 1) {
      const cand = evidence.questionCandidates[i];
      const expect = golden.questions[i];
      assert.equal(cand.questionNumber, expect.questionNumber);
      assert.equal(cand.subQuestions.length, 1);
      const joined = norm(
        [cand.text, ...cand.subQuestions.map((s) => s.text)].join(" ")
      );
      for (const sub of expect.subQuestions) {
        assert.ok(
          joined.includes(norm(sub.text)),
          `${expect.questionNumber} missing: ${sub.text.slice(0, 40)}`
        );
      }
    }
  });

  it("blocks save when OCR confidence is low even if schema would PASS", () => {
    const golden = loadGolden();
    const extracted = makePyqs([
      makePaper(
        2026,
        "June",
        golden.questions.map((q, qi) =>
          makeQuestion(
            `q${qi + 1}`,
            q.questionNumber,
            q.subQuestions.map((s, si) =>
              makeSub(`q${qi + 1}${si}`, s.label, s.text)
            )
          )
        )
      ),
    ]);
    const assessment = assessExtractionQuality({
      extractedPyqs: extracted,
      validationStatus: "PASS",
      ocrTexts: ["Total No. of Questions : 8"],
      ocrConfidencePercent: 50,
    });
    assert.equal(assessment.readiness, "NEEDS_REVIEW");
    assert.equal(assessment.canSave, false);
    assert.equal(assessment.questionCount, 8);
  });
});

describe("AL-405 golden — real scanned PDF OCR (live)", () => {
  it("produces 8×(a/b) hierarchy from the real PDF; exact wording asserted honestly", async () => {
    if (!fs.existsSync(PDF_PATH)) {
      assert.ok(false, `Golden PDF missing at ${PDF_PATH}`);
    }
    const golden = loadGolden();
    const jobId = `golden_al405_${Date.now()}`;
    const jobDir = path.join(HERE, ".tmp-ocr", jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const engine = new LocalOcrEngine();
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const started = Date.now();
    const raw = await engine.extract({
      jobId,
      jobDir,
      document: {
        filename: "al-405-machine-learning-jun-2026.pdf",
        mimeType: "application/pdf",
        kind: "pdf",
        buffer: pdfBuffer,
        absolutePath: PDF_PATH,
      },
    });
    const ocrMs = Date.now() - started;
    console.log("[AL405 golden] OCR ms", ocrMs, "pages", raw.pages.length);

    const structured = buildStructuredDocument(raw);
    const evidence = buildExtractionEvidence({ raw, structured });

    assert.equal(evidence.paperSegmentation.papers.length, 1);
    assert.equal(
      evidence.questionCandidates.length,
      8,
      `expected 8 questions, got ${evidence.questionCandidates.map((c) => c.questionNumber)}`
    );

    const nums = evidence.questionCandidates.map((c) => c.questionIndex);
    assert.deepEqual(nums, [1, 2, 3, 4, 5, 6, 7, 8]);

    let exact = 0;
    const mismatches: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      const cand = evidence.questionCandidates[i];
      const expect = golden.questions[i];
      assert.equal(cand.questionNumber, expect.questionNumber);
      // At least one (b) sub attached; (a) may live on the question opener text.
      assert.ok(
        cand.subQuestions.length >= 1,
        `${expect.questionNumber} has no sub-questions`
      );
      const joined = norm(
        [cand.text, ...cand.subQuestions.map((s) => s.text)].join("\n")
      );
      assert.equal(containsIndicScript(joined), false);

      for (const sub of expect.subQuestions) {
        const target = norm(sub.text);
        if (joined.includes(target)) {
          exact += 1;
        } else {
          // Allow recoverable OCR near-miss only for report — still fail assert below.
          mismatches.push(
            `${expect.questionNumber}${sub.label}: expected=${target.slice(0, 70)} got=${joined.slice(0, 120)}`
          );
        }
      }
    }

    console.log("[AL405 golden] exact wording", exact, "/ 16");
    if (mismatches.length > 0) {
      console.log("[AL405 golden] mismatches\n" + mismatches.join("\n"));
    }

    // Honest gate: real OCR must recover every English string exactly.
    // If this fails, the fixture is a known failing real-world extraction —
    // do not weaken the assertion.
    assert.equal(
      exact,
      16,
      `Exact English wording recovered ${exact}/16. First issues:\n${mismatches.slice(0, 4).join("\n")}`
    );
  });
});
