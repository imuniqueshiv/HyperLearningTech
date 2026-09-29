/**
 * Phase 2 extraction tests: numbering, papers, evidence, AI hallucination,
 * tables, diagram markers, reading order.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBoundingBox } from "../../lib/content-pipeline/coordinates";
import {
  DIAGRAM_PRESENT_MARKER,
  buildExtractionEvidence,
} from "../../lib/content-pipeline/extraction-evidence";
import {
  academicFromEvidence,
  validateAgainstEvidence,
} from "../../lib/content-pipeline/evidence-validator";
import { segmentPapers } from "../../lib/content-pipeline/paper-segmenter";
import {
  analyzeQuestionNumberSequence,
  extractNumericalTokens,
  normalizeNumericToken,
  parseQuestionNumber,
  parseSubQuestionLabel,
} from "../../lib/content-pipeline/question-number";
import { sortByReadingOrder } from "../../lib/content-pipeline/reading-order";
import { classifyTextBlock } from "../../lib/content-pipeline/block-detector";
import type { RawDocument } from "../../lib/content-pipeline/raw-document";
import type { StructuredDocument } from "../../lib/content-pipeline/structured-document";
import type { AcademicDocument } from "../../lib/content-pipeline/academic-document";

function bbox(x: number, y: number, w = 100, h = 12) {
  return createBoundingBox(x, y, w, h);
}

describe("Phase 2 question numbering", () => {
  it("parses Q.1 / Question 1 / 1) variants", () => {
    assert.equal(parseQuestionNumber("Q.1 Explain…")?.canonical, "Q.1");
    assert.equal(parseQuestionNumber("Q1. Define")?.canonical, "Q.1");
    assert.equal(parseQuestionNumber("Question 2 ")?.canonical, "Q.2");
    assert.equal(parseQuestionNumber("1. Explain sorting")?.canonical, "Q.1");
    assert.equal(parseQuestionNumber("2) Derive")?.canonical, "Q.2");
  });

  it("does not treat numerical content as question numbers", () => {
    assert.equal(parseQuestionNumber("2.5 kg of material"), null);
    assert.equal(parseQuestionNumber("2025 examination"), null);
    assert.equal(parseQuestionNumber("1/2 of the mass"), null);
    assert.equal(parseQuestionNumber("10^-3 units"), null);
  });

  it("parses subquestion labels", () => {
    assert.equal(parseSubQuestionLabel("a) Find MST")?.canonical, "a)");
    assert.equal(parseSubQuestionLabel("(b) Proof")?.canonical, "b)");
    assert.equal(parseSubQuestionLabel("Q.1(a) Define")?.canonical, "a)");
  });

  it("detects gaps and duplicates", () => {
    const { gaps, duplicates } = analyzeQuestionNumberSequence([1, 2, 2, 4]);
    assert.deepEqual(duplicates, [2]);
    assert.ok(gaps.includes(3));
  });

  it("extracts numerical tokens for evidence", () => {
    const tokens = extractNumericalTokens("W=16 I1=9/15 I2=6/6 rate 0.25");
    assert.ok(tokens.map(normalizeNumericToken).includes("16"));
    assert.ok(tokens.map(normalizeNumericToken).includes("9"));
    assert.ok(tokens.map(normalizeNumericToken).includes("15"));
    assert.ok(tokens.map(normalizeNumericToken).includes("0.25"));
  });
});

describe("Phase 2 reading order", () => {
  it("orders single column top-to-bottom", () => {
    const items = [
      { id: "b", bbox: bbox(10, 80) },
      { id: "a", bbox: bbox(10, 20) },
      { id: "c", bbox: bbox(10, 120) },
    ];
    const ordered = sortByReadingOrder(items);
    assert.deepEqual(
      ordered.map((o) => o.item.id),
      ["a", "b", "c"]
    );
  });

  it("handles two-column layout left-then-right", () => {
    const items = [];
    for (let i = 0; i < 5; i += 1) {
      items.push({ id: `L${i}`, bbox: bbox(20, 40 + i * 20, 80, 12) });
      items.push({ id: `R${i}`, bbox: bbox(320, 40 + i * 20, 80, 12) });
    }
    const ordered = sortByReadingOrder(items, 8, 500);
    const ids = ordered.map((o) => o.item.id);
    assert.equal(ids.length, 10);
    // When columns are detected, all left ids appear before all right ids.
    const leftIdx = ids
      .map((id, i) => (id.startsWith("L") ? i : -1))
      .filter((i) => i >= 0);
    const rightIdx = ids
      .map((id, i) => (id.startsWith("R") ? i : -1))
      .filter((i) => i >= 0);
    const maxLeft = Math.max(...leftIdx);
    const minRight = Math.min(...rightIdx);
    assert.ok(
      maxLeft < minRight,
      `expected left-before-right, got ${ids.join(",")}`
    );
  });
});

describe("Phase 2 block classification", () => {
  it("classifies Q markers and instructions separately", () => {
    const q = classifyTextBlock({
      id: "1",
      pageNumber: 1,
      text: "Q.3 Explain pipelining",
      bbox: bbox(40, 200),
      pageWidth: 600,
      pageHeight: 800,
      medianTextHeight: 12,
    });
    assert.equal(q.kind, "question");

    const instr = classifyTextBlock({
      id: "2",
      pageNumber: 1,
      text: "Attempt any five questions.",
      bbox: bbox(40, 100),
      pageWidth: 600,
      pageHeight: 800,
      medianTextHeight: 12,
    });
    assert.notEqual(instr.kind, "question");
  });
});

describe("Phase 2 paper segmentation", () => {
  it("keeps single paper when declaredPaperCount=1", () => {
    const raw = makeRaw([
      { page: 1, texts: ["Q.1 One", "Q.2 Two"] },
      { page: 2, texts: ["Q.3 Three"] },
    ]);
    const result = segmentPapers(raw, 1);
    assert.equal(result.papers.length, 1);
    assert.deepEqual(result.papers[0].pageNumbers, [1, 2]);
    assert.equal(result.reviewRequired, false);
  });

  it("ignores multi-paper declaration and keeps one paper-1", () => {
    const raw = makeRaw([
      { page: 1, texts: ["RGPV Examination", "AL-401", "Q.1 First"] },
      { page: 2, texts: ["Q.5 Continue"] },
      {
        page: 3,
        texts: ["RGPV Examination", "AL-401", "Q.1 Looks like reset"],
      },
      { page: 4, texts: ["Q.2 Continues"] },
    ]);
    const result = segmentPapers(raw, 2);
    assert.equal(result.papers.length, 1);
    assert.equal(result.papers[0].paperId, "paper-1");
    assert.ok(result.warnings.includes("MULTI_PAPER_DECLARATION_IGNORED"));
  });
});

describe("Phase 2 evidence + AI hallucination guard", () => {
  it("rejects AI inventing numerical values not in evidence", () => {
    const evidence = buildSimpleEvidence("W = 16 and profit 15");
    const academic = makeAcademic("W = 18 and profit 15");
    const result = validateAgainstEvidence(academic, evidence);
    assert.equal(result.status, "INVALID");
    assert.ok(
      result.errors.some((e) => e.includes("AI_NUMBER_NOT_IN_EVIDENCE:18"))
    );
  });

  it("accepts matching numerical evidence", () => {
    const evidence = buildSimpleEvidence("W=16 I1=9 P=15");
    const academic = makeAcademic("Given W=16, item I1 weight 9 profit 15");
    const result = validateAgainstEvidence(academic, evidence);
    assert.notEqual(result.status, "INVALID");
  });

  it("preserves diagram marker in evidence fallback", () => {
    const evidence = buildSimpleEvidence("Construct MST", true);
    const academic = academicFromEvidence(evidence, {
      metadata: {
        jobId: "job",
        jobType: "pyq",
        sourceFilename: "x.pdf",
        subjectCode: "AL-402",
        subjectName: null,
        subjectTitle: null,
        branch: null,
        semester: null,
        university: null,
        structuredAt: new Date().toISOString(),
        model: "test",
        detector: "test",
      },
    });
    const text = academic.questions[0]?.subQuestions[0]?.text ?? "";
    assert.match(text, /\[DIAGRAM_PRESENT\]/);
  });

  it("table cells are preserved in evidence package", () => {
    const raw = makeRaw([{ page: 1, texts: ["Q.1 Tabular data", "Item W P"] }]);
    raw.tables = [
      {
        id: "t1",
        pageNumber: 1,
        path: "tables/table-1.json",
        bbox: bbox(40, 300, 200, 80),
        rows: 3,
        columns: 3,
        cells: [
          { row: 0, column: 0, text: "Item" },
          { row: 0, column: 1, text: "W" },
          { row: 0, column: 2, text: "P" },
          { row: 1, column: 0, text: "I1" },
          { row: 1, column: 1, text: "9" },
          { row: 1, column: 2, text: "15" },
          { row: 2, column: 0, text: "I2" },
          { row: 2, column: 1, text: "6" },
          { row: 2, column: 2, text: "6" },
        ],
      },
    ];
    const structured = makeStructuredFromRaw(raw);
    const evidence = buildExtractionEvidence({
      raw,
      structured,
      declaredPaperCount: 1,
    });
    assert.equal(evidence.tables.length, 1);
    assert.equal(evidence.tables[0].rows, 3);
    assert.equal(evidence.tables[0].cells.length, 9);
    const nums = evidence.tables[0].cells.map((c) => c.text);
    assert.ok(nums.includes("9") && nums.includes("15") && nums.includes("6"));
  });
});

describe("Phase 2 idempotent ordering", () => {
  it("sorts candidates by question serial number", () => {
    const raw = makeRaw([
      { page: 1, texts: ["Q.3 Third", "Q.1 First", "Q.2 Second"] },
    ]);
    // Structured with out-of-order question nodes
    const structured = makeStructuredQuestions([
      { id: "q3", text: "Q.3 Third", page: 1, y: 10 },
      { id: "q1", text: "Q.1 First", page: 1, y: 40 },
      { id: "q2", text: "Q.2 Second", page: 1, y: 70 },
    ]);
    const evidence = buildExtractionEvidence({
      raw,
      structured,
      declaredPaperCount: 1,
    });
    assert.deepEqual(
      evidence.questionCandidates.map((q) => q.questionNumber),
      ["Q.1", "Q.2", "Q.3"]
    );
  });
});

// --- helpers ---

function makeRaw(pages: Array<{ page: number; texts: string[] }>): RawDocument {
  return {
    version: 1,
    metadata: {
      jobId: "job_test",
      sourceFilename: "paper.pdf",
      sourceMimeType: "application/pdf",
      engine: "test",
      extractedAt: new Date().toISOString(),
      pageCount: pages.length,
      imageCount: 0,
      tableCount: 0,
      textBlockCount: pages.reduce((s, p) => s + p.texts.length, 0),
      durationMs: 1,
    },
    pages: pages.map((p) => ({
      pageNumber: p.page,
      width: 600,
      height: 800,
      imagePath: null,
      text: p.texts.join("\n"),
      textBlocks: p.texts.map((text, i) => ({
        id: `p${p.page}-t${i}`,
        pageNumber: p.page,
        text,
        bbox: bbox(40, 40 + i * 24),
        confidence: 0.9,
      })),
      layout: {
        pageNumber: p.page,
        width: 600,
        height: 800,
        blocks: [],
      },
    })),
    images: [],
    tables: [],
  };
}

function makeStructuredFromRaw(raw: RawDocument): StructuredDocument {
  const nodes: StructuredDocument["nodes"] = {};
  const pageIds: string[] = [];
  const rootId = "doc";
  nodes[rootId] = {
    id: rootId,
    kind: "document",
    pageNumber: 0,
    bbox: bbox(0, 0, 0, 0),
    parentId: null,
    childIds: [],
    readingOrder: 0,
    text: "doc",
  };

  let order = 0;
  for (const page of raw.pages) {
    const pageId = `page-${page.pageNumber}`;
    pageIds.push(pageId);
    nodes[pageId] = {
      id: pageId,
      kind: "page",
      pageNumber: page.pageNumber,
      bbox: bbox(0, 0, page.width, page.height),
      parentId: rootId,
      childIds: [],
      readingOrder: ++order,
      width: page.width,
      height: page.height,
      imagePath: null,
    };
    (nodes[rootId] as { childIds: string[] }).childIds.push(pageId);

    for (const block of page.textBlocks) {
      const parsed = parseQuestionNumber(block.text);
      const kind = parsed ? "question" : "paragraph";
      nodes[block.id] = {
        id: block.id,
        kind,
        pageNumber: page.pageNumber,
        bbox: block.bbox,
        parentId: pageId,
        childIds: [],
        readingOrder: ++order,
        text: block.text,
        confidence: block.confidence,
      };
      (nodes[pageId] as { childIds: string[] }).childIds.push(block.id);
    }
  }

  return {
    version: 1,
    metadata: {
      jobId: raw.metadata.jobId,
      sourceFilename: raw.metadata.sourceFilename,
      sourceMimeType: raw.metadata.sourceMimeType,
      detector: "test",
      structuredAt: new Date().toISOString(),
      pageCount: raw.pages.length,
      sectionCount: 0,
      questionCount: Object.values(nodes).filter((n) => n.kind === "question")
        .length,
      subQuestionCount: 0,
      figureCount: 0,
      tableCount: raw.tables.length,
      captionCount: 0,
      durationMs: 1,
    },
    rootId,
    pageIds,
    nodes,
  };
}

function makeStructuredQuestions(
  questions: Array<{ id: string; text: string; page: number; y: number }>
): StructuredDocument {
  const raw = makeRaw([
    {
      page: 1,
      texts: questions.map((q) => q.text),
    },
  ]);
  const structured = makeStructuredFromRaw(raw);
  // Force ids
  return structured;
}

function buildSimpleEvidence(text: string, diagram = false) {
  const raw = makeRaw([{ page: 1, texts: [`Q.1 ${text}`] }]);
  const structured = makeStructuredFromRaw(raw);
  if (diagram) {
    const qId = Object.keys(structured.nodes).find(
      (id) => structured.nodes[id]?.kind === "question"
    );
    if (qId) {
      structured.nodes["fig1"] = {
        id: "fig1",
        kind: "figure",
        pageNumber: 1,
        bbox: bbox(40, 400, 200, 200),
        parentId: qId,
        childIds: [],
        readingOrder: 99,
        path: "images/image-1.webp",
        width: 200,
        height: 200,
        mimeType: "image/webp",
      };
      structured.nodes[qId].childIds.push("fig1");
    }
  }
  return buildExtractionEvidence({
    raw,
    structured,
    declaredPaperCount: 1,
  });
}

function makeAcademic(text: string): AcademicDocument {
  return {
    version: 1,
    metadata: {
      jobId: "job",
      jobType: "pyq",
      sourceFilename: "x.pdf",
      subjectCode: "X",
      subjectName: null,
      subjectTitle: null,
      branch: null,
      semester: null,
      university: null,
      structuredAt: new Date().toISOString(),
      model: "test",
      detector: "test",
    },
    exam: null,
    units: [],
    topics: [],
    questions: [
      {
        id: "q1",
        questionNumber: "Q.1",
        marks: null,
        subQuestions: [
          {
            id: "q1a",
            label: "",
            text,
            latex: null,
            unit: null,
            type: null,
            marks: null,
            difficulty: null,
            questionType: null,
            attachments: [],
          },
        ],
      },
    ],
    diagrams: [],
    usage: null,
  };
}

// silence unused marker import warning via assert in diagram test
void DIAGRAM_PRESENT_MARKER;
