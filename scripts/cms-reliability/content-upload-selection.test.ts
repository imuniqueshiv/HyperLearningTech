/**
 * Regression tests for CMS upload file-selection helpers.
 * Guards the FileList → state path without a browser DOM.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeSelectedFiles,
  validateSelectedFiles,
} from "../../components/admin/content-upload";
import { IMPORT_LIMIT_MESSAGES } from "../../lib/content-pipeline/import-limits";

function fakeFile(name: string, type: string, bytes = 100): File {
  return new File([Buffer.alloc(bytes, 1)], name, { type });
}

describe("CMS upload file selection helpers", () => {
  it("accepts a single PDF and keeps selection", () => {
    const pdf = fakeFile("al-405.pdf", "application/pdf", 110_000);
    const result = normalizeSelectedFiles([pdf]);
    assert.equal(result.error, null);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].name, "al-405.pdf");
    assert.equal(validateSelectedFiles(result.files), null);
  });

  it("replaces multiple PDFs with the last one (one paper)", () => {
    const a = fakeFile("a.pdf", "application/pdf");
    const b = fakeFile("b.pdf", "application/pdf");
    const result = normalizeSelectedFiles([a, b]);
    assert.equal(result.error, null);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].name, "b.pdf");
  });

  it("accepts 1–5 images", () => {
    const images = [
      fakeFile("page-1.png", "image/png"),
      fakeFile("page-2.png", "image/png"),
      fakeFile("page-3.jpg", "image/jpeg"),
    ];
    const result = normalizeSelectedFiles(images);
    assert.equal(result.error, null);
    assert.equal(result.files.length, 3);
    assert.equal(validateSelectedFiles(result.files), null);
  });

  it("rejects more than 5 images", () => {
    const images = Array.from({ length: 6 }, (_, i) =>
      fakeFile(`page-${i + 1}.png`, "image/png")
    );
    const result = normalizeSelectedFiles(images);
    assert.equal(result.files.length, 0);
    assert.equal(result.error, IMPORT_LIMIT_MESSAGES.images);
  });

  it("rejects mixed PDF + images", () => {
    const result = normalizeSelectedFiles([
      fakeFile("paper.pdf", "application/pdf"),
      fakeFile("page-1.png", "image/png"),
    ]);
    assert.equal(result.files.length, 0);
    assert.match(result.error ?? "", /exactly one academic paper/i);
  });

  it("rejects unsupported types", () => {
    const result = normalizeSelectedFiles([
      fakeFile(
        "notes.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ),
    ]);
    assert.equal(result.files.length, 0);
    assert.match(result.error ?? "", /Unsupported file type/i);
  });

  it("validateSelectedFiles requires at least one file", () => {
    assert.match(validateSelectedFiles([]) ?? "", /at least one/i);
  });

  it("snapshots FileList-like arrays before clear (regression)", () => {
    // Simulates Chromium clearing a live FileList when input.value = "".
    const live: { files: File[] } = {
      files: [fakeFile("keep.pdf", "application/pdf", 2048)],
    };
    const snapshot = Array.from(live.files);
    live.files = []; // equivalent to clearing the live FileList
    const result = normalizeSelectedFiles(snapshot);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].name, "keep.pdf");
  });
});
