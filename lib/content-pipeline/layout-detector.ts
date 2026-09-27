import type { RawDocument } from "./raw-document";
import { buildStructuredDocument } from "./structure-builder";
import type { StructuredDocument } from "./structured-document";

/**
 * Layout detection entry point.
 * Converts RawDocument → StructuredDocument (structure only).
 */
export function detectLayout(rawDocument: RawDocument): StructuredDocument {
  const started = Date.now();
  console.log("[Layout] buildStructuredDocument started", {
    jobId: rawDocument.metadata.jobId,
    pageCount: rawDocument.pages.length,
  });
  const document = buildStructuredDocument(rawDocument);
  console.log("[Layout] buildStructuredDocument finished", {
    jobId: rawDocument.metadata.jobId,
    ms: Date.now() - started,
    sectionCount: document.metadata.sectionCount,
    questionCount: document.metadata.questionCount,
  });
  return document;
}
