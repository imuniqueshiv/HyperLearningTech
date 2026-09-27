import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const logPath = path.join(process.cwd(), "debug-26e666.log");

function log(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  const line = JSON.stringify({
    sessionId: "26e666",
    runId: "local-pdf-probe",
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
  const pdfPath =
    ".cms/uploads/job_ee30ea4fadc441bb8eeb7c855748812f/original.pdf";
  const buf = fs.readFileSync(pdfPath);
  log("H1", "probe:start", "Loading failed-session PDF", {
    pdfPath,
    bytes: buf.length,
  });

  const pdf = await getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
  }).promise;
  log("H1", "probe:opened", "PDF opened", { numPages: pdf.numPages });

  let totalItems = 0;
  let totalKept = 0;
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    let empty = 0;
    let kept = 0;
    for (const item of textContent.items) {
      totalItems += 1;
      const str =
        typeof (item as { str?: string }).str === "string"
          ? (item as { str: string }).str.trim()
          : "";
      if (!str) empty += 1;
      else kept += 1;
    }
    totalKept += kept;
    log("H1", "probe:page", "page textContent", {
      pageNumber,
      rawItemCount: textContent.items.length,
      emptyStrCount: empty,
      keptBlocks: kept,
    });
  }

  log("H2", "probe:done", "PDF text probe complete", {
    totalItems,
    totalKept,
    usesTesseractFallback: false,
    conclusion: totalKept === 0 ? "NO_TEXT_LAYER" : "HAS_TEXT",
  });
}

void main();
