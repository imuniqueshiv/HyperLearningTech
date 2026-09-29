import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

function resolvePdfJsWasmUrl(): string {
  const requireFromProject = createRequire(
    path.join(process.cwd(), "package.json")
  );
  const pdfjsEntry = requireFromProject.resolve("pdfjs-dist/package.json");
  const wasmDir = path.join(path.dirname(pdfjsEntry), "wasm");
  // Mirror out of space-containing project paths. Use POSIX trailing `/`
  // (not file://) — Node BinaryDataFactory uses fs.readFile, not fetch.
  const mirrorDir = path.join(os.tmpdir(), "hlt-pdfjs-wasm-v1");
  fs.mkdirSync(mirrorDir, { recursive: true });
  for (const name of fs.readdirSync(wasmDir)) {
    const dest = path.join(mirrorDir, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(wasmDir, name), dest);
    }
  }
  return mirrorDir.split(path.sep).join("/") + "/";
}

/**
 * Counts PDF pages using pdf.js without OCR.
 * Throws on encrypted/corrupt/unsupported documents.
 */
export async function countPdfPages(buffer: Buffer): Promise<number> {
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      wasmUrl: resolvePdfJsWasmUrl(),
      useWasm: true,
      // Fail fast on password-protected PDFs.
      password: "",
    });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    await pdf.cleanup();
    const maybeDestroy = pdf as { destroy?: () => Promise<void> };
    await maybeDestroy.destroy?.();
    return pageCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password|encrypt/i.test(message)) {
      throw new Error("PDF_ENCRYPTED");
    }
    throw new Error("INVALID_PDF");
  }
}
