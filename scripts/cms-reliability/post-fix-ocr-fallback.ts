/**
 * Post-fix: OCR the failed-session scanned PDF with Tesseract fallback.
 */
import fs from "fs";
import path from "path";

import { LocalOcrEngine } from "../../lib/content-pipeline/local-ocr-engine";
import { loadDocumentFile } from "../../lib/content-pipeline/document-loader";

const logPath = path.join(process.cwd(), "debug-26e666.log");

function log(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  const line = JSON.stringify({
    sessionId: "26e666",
    runId: "post-fix",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  });
  fs.appendFileSync(logPath, line + "\n");
  console.log(line);
}

async function main() {
  const sourcePdf =
    ".cms/uploads/job_ee30ea4fadc441bb8eeb7c855748812f/original.pdf";
  const jobId = `job_postfix_${Date.now()}`;
  const jobDir = path.join(process.cwd(), ".cms", "uploads", jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  const destPdf = path.join(jobDir, "original.pdf");
  fs.copyFileSync(sourcePdf, destPdf);

  log("H1", "post-fix:start", "Running LocalOcrEngine on scanned PDF", {
    jobId,
    sourcePdf,
  });

  const document = await loadDocumentFile(destPdf, "application/pdf");
  const engine = new LocalOcrEngine();
  const raw = await engine.extract({ jobId, jobDir, document });

  log("H1", "post-fix:done", "OCR complete after Tesseract fallback", {
    jobId,
    pageCount: raw.metadata.pageCount,
    textBlockCount: raw.metadata.textBlockCount,
    imageCount: raw.metadata.imageCount,
    totalTextChars: raw.pages.reduce((s, p) => s + (p.text?.length || 0), 0),
    pages: raw.pages.map((p) => ({
      pageNumber: p.pageNumber,
      textLen: p.text?.length || 0,
      blocks: p.textBlocks.length,
      hasImage: Boolean(p.imagePath),
    })),
  });

  console.log(
    JSON.stringify(
      {
        textBlockCount: raw.metadata.textBlockCount,
        sample: raw.pages[0]?.text?.slice(0, 200),
      },
      null,
      2
    )
  );
}

void main();
