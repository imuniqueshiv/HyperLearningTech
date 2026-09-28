import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Counts PDF pages using pdf.js without OCR.
 * Throws on encrypted/corrupt/unsupported documents.
 */
export async function countPdfPages(buffer: Buffer): Promise<number> {
  const requireFromProject = createRequire(
    path.join(process.cwd(), "package.json")
  );
  const pdfjsEntry = requireFromProject.resolve("pdfjs-dist/package.json");
  const wasmDir = path.join(path.dirname(pdfjsEntry), "wasm");
  const wasmUrl = pathToFileURL(wasmDir + path.sep).href;

  try {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      wasmUrl,
      useWasm: true,
      // Fail fast on password-protected PDFs.
      password: "",
    });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    await pdf.cleanup();
    return pageCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password|encrypt/i.test(message)) {
      throw new Error("PDF_ENCRYPTED");
    }
    throw new Error("INVALID_PDF");
  }
}
