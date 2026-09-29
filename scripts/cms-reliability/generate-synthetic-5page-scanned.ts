/**
 * Build a labelled synthetic 5-page SCANNED PDF from real page rasters
 * (4-page Dec 2023 + page 1 of AL-402 Jun 2025). Not a native-text PDF.
 */
import fs from "node:fs";
import path from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { jsPDF } from "jspdf";

import { getResolvedPdfJsWasmUrl } from "../../lib/content-pipeline/local-ocr-engine";

async function rasterPage(
  pdfPath: string,
  pageNumber: number,
  scale = 1.25
): Promise<{ png: Buffer; width: number; height: number }> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    wasmUrl: getResolvedPdfJsWasmUrl(),
    useWasm: true,
  }).promise;
  const page = await pdf.getPage(pageNumber);
  const vp = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
  const ctx = canvas.getContext("2d");
  await page.render({
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport: vp,
  }).promise;
  const png = Buffer.from(await canvas.encode("png"));
  page.cleanup?.();
  await pdf.cleanup();
  await (pdf as { destroy?: () => Promise<void> }).destroy?.();
  return {
    png,
    width: Math.ceil(vp.width),
    height: Math.ceil(vp.height),
  };
}

async function main() {
  const four = path.join(
    process.cwd(),
    ".cms/uploads/job_01cebe9d057e409eb66dd4b7fbfcc2a0/original.pdf"
  );
  const two = path.join(
    process.cwd(),
    ".cms/uploads/job_2b2e0be4fd5a4aa18a20cd4495ae8096/original.pdf"
  );
  if (!fs.existsSync(four) || !fs.existsSync(two)) {
    throw new Error("Source scanned PDFs missing under .cms/uploads");
  }

  const pages = [
    await rasterPage(four, 1),
    await rasterPage(four, 2),
    await rasterPage(four, 3),
    await rasterPage(four, 4),
    await rasterPage(two, 1),
  ];

  // A4 points; fit each raster to page.
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i += 1) {
    if (i > 0) doc.addPage();
    const { png, width, height } = pages[i];
    const scale = Math.min(pageW / width, pageH / height);
    const w = width * scale;
    const h = height * scale;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    const dataUri = `data:image/png;base64,${png.toString("base64")}`;
    doc.addImage(dataUri, "PNG", x, y, w, h);
  }

  const out = path.join(
    process.cwd(),
    "scripts/cms-reliability/fixtures/synthetic-5page-scanned.pdf"
  );
  fs.writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
  console.log("Wrote", out, "pages=5 bytes=", fs.statSync(out).size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
