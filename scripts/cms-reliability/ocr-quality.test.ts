import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortProductionPyqs } from "../../lib/content-pipeline/content-sorter";
import {
  assessOcrDocument,
  assessRasterPixels,
  assertOcrDocumentUsable,
  BLANK_RASTER_MAX_BYTES,
  isPageTextUsable,
  MIN_USABLE_DOCUMENT_CHARS,
  OcrQualityError,
} from "../../lib/content-pipeline/ocr-quality";
import { CMS_ERROR_CODES } from "../../lib/content-pipeline/pipeline-errors";
import type { RawDocument } from "../../lib/content-pipeline/raw-document";
import { fixtureIncompletePaper } from "./fixtures/pyqs-fixtures";

function page(input: {
  text: string;
  blocks?: number;
  raster?: { pngBytes: number; nonWhiteSampled: number; blank: boolean };
}): RawDocument["pages"][number] {
  const blocks = Array.from({ length: input.blocks ?? 0 }, (_, i) => ({
    id: `t${i}`,
    pageNumber: 1,
    text: input.text,
    bbox: { x: 0, y: 0, width: 10, height: 10 },
  }));
  return {
    pageNumber: 1,
    width: 100,
    height: 100,
    imagePath: "pages/page-1.png",
    text: input.text,
    textBlocks: blocks,
    layout: { pageNumber: 1, width: 100, height: 100, blocks: [] },
    raster: input.raster,
  };
}

function doc(pages: RawDocument["pages"], textBlockCount: number): RawDocument {
  return {
    version: 1,
    metadata: {
      jobId: "job_test",
      sourceFilename: "test.pdf",
      sourceMimeType: "application/pdf",
      engine: "local-ocr-v1",
      extractedAt: new Date().toISOString(),
      pageCount: pages.length,
      imageCount: 0,
      tableCount: 0,
      textBlockCount,
      durationMs: 1,
    },
    pages,
    images: [],
    tables: [],
  };
}

describe("OCR quality gates", () => {
  it("treats forensic blank raster stats as blank", () => {
    const quality = assessRasterPixels({
      pngBytes: 10344,
      width: 1684,
      height: 1191,
      nonWhiteSampled: 0,
    });
    assert.equal(quality.blank, true);
    assert.ok(quality.pngBytes < BLANK_RASTER_MAX_BYTES);
  });

  it("treats a real rendered page as non-blank", () => {
    const quality = assessRasterPixels({
      pngBytes: 407787,
      width: 1684,
      height: 1191,
      nonWhiteSampled: 10480,
    });
    assert.equal(quality.blank, false);
  });

  it("rejects empty OCR that previously reported SUCCESS", () => {
    const empty = doc(
      [
        page({
          text: "",
          raster: { pngBytes: 10344, nonWhiteSampled: 0, blank: true },
        }),
        page({
          text: "",
          raster: { pngBytes: 10344, nonWhiteSampled: 0, blank: true },
        }),
      ],
      0
    );
    const quality = assessOcrDocument(empty);
    assert.equal(quality.usable, false);
    assert.equal(quality.failureCode, CMS_ERROR_CODES.PDF_RENDER_EMPTY);
    assert.throws(
      () => assertOcrDocumentUsable(empty),
      (error: unknown) =>
        error instanceof OcrQualityError &&
        error.code === CMS_ERROR_CODES.PDF_RENDER_EMPTY
    );
  });

  it("accepts healthy OCR text above the documented threshold", () => {
    const stem = "Explain merge sort for the list 65, 47, 24, 83, 91, 14, 53.";
    assert.ok(stem.length > MIN_USABLE_DOCUMENT_CHARS / 2);
    const healthy = doc([page({ text: `${stem} ${stem}`, blocks: 12 })], 12);
    const quality = assessOcrDocument(healthy);
    assert.equal(quality.usable, true);
    assert.equal(
      isPageTextUsable(stem.repeat(2), healthy.pages[0].textBlocks),
      true
    );
  });

  it("does not crash sorter when paper.month/exam are missing (writer forensic)", () => {
    const incoming = fixtureIncompletePaper();
    const broken = {
      ...incoming,
      papers: incoming.papers.map((paper) => ({
        ...paper,
        month: undefined as unknown as string,
        exam: undefined as unknown as string,
      })),
    };
    const sorted = sortProductionPyqs(broken);
    assert.equal(sorted.papers.length, incoming.papers.length);
  });
});
