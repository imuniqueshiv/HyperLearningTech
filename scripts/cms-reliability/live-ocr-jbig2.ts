/**
 * Live OCR + metadata extraction against the forensic JBIG2 PDF.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createDefaultOcrEngine } from "../../lib/content-pipeline/local-ocr-engine";
import {
  extractMetadata,
  loadSubjectCatalog,
} from "../../lib/content-pipeline/metadata-extractor";
import { assertOcrDocumentUsable } from "../../lib/content-pipeline/ocr-quality";

async function main() {
  const pdfPath = path.join(
    process.cwd(),
    "scripts",
    "cms-reliability",
    "fixtures",
    "jbig2-al-402.pdf"
  );
  const buffer = fs.readFileSync(pdfPath);
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "cms-ocr-e2e-"));
  const engine = createDefaultOcrEngine();
  const started = Date.now();
  const document = await engine.extract({
    jobId: "job_live_jbig2_e2e",
    jobDir,
    document: {
      absolutePath: pdfPath,
      buffer,
      mimeType: "application/pdf",
      kind: "pdf",
      filename: "al-cd-402-analysis-and-design-of-algorithm-jun-2022.pdf",
    },
  });
  const quality = assertOcrDocumentUsable(document);
  const catalog = await loadSubjectCatalog();
  const extracted = extractMetadata({
    filename: "al-cd-402-analysis-and-design-of-algorithm-jun-2022.pdf",
    ocrText: document.pages.map((page) => page.text).join("\n"),
    catalog,
  });
  const result = {
    ok: true,
    ms: Date.now() - started,
    pageCount: document.metadata.pageCount,
    textBlockCount: document.metadata.textBlockCount,
    totalChars: quality.totalChars,
    usablePageCount: quality.usablePageCount,
    blankRasterPages: quality.blankRasterPages,
    sample: document.pages[0]?.text.slice(0, 180) ?? "",
    metadata: {
      subjectCode: extracted.subjectCode.value,
      branch: extracted.branch.value,
      semester: extracted.semester.value,
      year: extracted.year.value,
      examSession: extracted.examSession.value,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  fs.rmSync(jobDir, { recursive: true, force: true });
}

void main();
