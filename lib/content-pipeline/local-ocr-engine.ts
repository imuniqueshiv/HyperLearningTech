import fs from "fs/promises";
import fsSync from "fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "path";

import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { CMS_JOB_TABLES_DIR } from "./constants";
import { getOcrPageConcurrency } from "./import-limits";
import { createBoundingBox } from "./coordinates";
import type { LoadedDocument } from "./document-loader";
import { saveExtractedImage } from "./image-extractor";
import type { PageLayout } from "./layout";
import type { OcrEngine } from "./ocr-engine";
import {
  extractImageAsPage,
  pageFullBoundingBox,
  writePageRaster,
} from "./page-extractor";
import type {
  RawDocument,
  RawImageRef,
  RawPage,
  RawTable,
  RawTextBlock,
} from "./raw-document";
import { loadNativeCanvas } from "./native-canvas";
import {
  assessRasterPixels,
  isPageTextUsable,
  sampleNonWhitePixels,
} from "./ocr-quality";
import {
  attachPerfToRawMetadata,
  perfAdd,
  perfMark,
  perfMeasure,
  perfPageOcr,
  perfPagePostOcr,
  perfPageRaster,
  perfSetActiveWorkers,
  resetOcrPerfProbe,
} from "./ocr-perf-probe";
import { safeTrim } from "./string-normalize";

/**
 * Raster scale for scanned PDF pages.
 * Profiled on real JBIG2 AL-402 (2 pages):
 * - scale 2 sequential ≈ 6.9s total OCR path
 * - scale 2 parallel ≈ 4.2s (same line/text quality)
 * - scale 1.5 parallel ≈ 3.9–4.6s typical (equal line counts vs scale 2)
 * - scale 1.25 parallel ≈ 3.4s but loses lines on page 1
 * Keep 1.5: best speed/quality balance measured on the fixture.
 */
export const SCAN_RASTER_SCALE = 1.5;

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

async function acquireOcrWorkers(count: number): Promise<TesseractWorker[]> {
  const needed = Math.max(1, count);
  return Promise.all(Array.from({ length: needed }, () => createWorker("eng")));
}

async function releaseOcrWorkers(workers: TesseractWorker[]): Promise<void> {
  await Promise.all(workers.map((worker) => worker.terminate()));
}

let cachedWasmUrl: string | null = null;

/**
 * pdf.js needs wasmUrl (trailing `/`) for JBIG2/OpenJPEG/QCMS assets.
 * Without it, scanned JBIG2 pages rasterize blank.
 *
 * Root cause of prior `#instantiateWasm` failures on Node:
 * - `pathToFileURL(...).href` produces `file:///.../wasm/`
 * - Node's `NodeBinaryDataFactory` loads via `fs.readFile(url)` which does
 *   NOT understand `file://` → ENOENT → JS JBIG2 fallback (slow + variance)
 * - pdf.js also rejects Windows `\` trailing separators ("must include
 *   trailing slash") — use POSIX-style `C:/.../wasm/` paths on Windows.
 * Mirror into a space-free temp dir once per process for path safety.
 */
function resolvePdfJsWasmUrl(): string {
  if (cachedWasmUrl) {
    return cachedWasmUrl;
  }
  const requireFromProject = createRequire(
    path.join(process.cwd(), "package.json")
  );
  const pdfjsEntry = requireFromProject.resolve("pdfjs-dist/package.json");
  const wasmDir = path.join(path.dirname(pdfjsEntry), "wasm");
  const mirrorDir = path.join(os.tmpdir(), "hlt-pdfjs-wasm-v1");
  fsSync.mkdirSync(mirrorDir, { recursive: true });
  for (const name of fsSync.readdirSync(wasmDir)) {
    const src = path.join(wasmDir, name);
    const dest = path.join(mirrorDir, name);
    if (!fsSync.existsSync(dest)) {
      fsSync.copyFileSync(src, dest);
    }
  }
  cachedWasmUrl = mirrorDir.split(path.sep).join("/") + "/";
  return cachedWasmUrl;
}

/** Exported for probes / diagnostics only. */
export function getResolvedPdfJsWasmUrl(): string {
  return resolvePdfJsWasmUrl();
}

type PdfJsTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
};

/**
 * Default local OCR engine.
 * - Images → Tesseract.js text + page/image rasters via sharp
 * - PDFs → pdf.js text items; if a page has no text layer, rasterize + Tesseract
 *
 * Replaceable: implement OcrEngine and inject via ocr-service.
 */
export class LocalOcrEngine implements OcrEngine {
  readonly name = "local-ocr-v1";

  async extract(input: {
    jobId: string;
    jobDir: string;
    document: LoadedDocument;
    documents?: LoadedDocument[];
  }): Promise<RawDocument> {
    const started = Date.now();
    resetOcrPerfProbe(getOcrPageConcurrency());

    const pages =
      input.documents && input.documents.length > 1
        ? input.documents
        : [input.document];

    const document =
      pages[0].kind === "pdf"
        ? await this.extractPdf({
            jobId: input.jobId,
            jobDir: input.jobDir,
            document: pages[0],
          })
        : pages.length === 1
          ? await this.extractImage({
              jobId: input.jobId,
              jobDir: input.jobDir,
              document: pages[0],
              pageNumber: 1,
            })
          : await this.extractImages({
              jobId: input.jobId,
              jobDir: input.jobDir,
              documents: pages,
            });

    document.metadata.durationMs = Date.now() - started;
    document.metadata.engine = this.name;
    document.metadata.jobId = input.jobId;
    document.metadata.sourceFilename =
      pages.length > 1 ? `${pages.length}-page session` : pages[0].filename;
    document.metadata.sourceMimeType = pages[0].mimeType;
    document.metadata.extractedAt = new Date().toISOString();
    document.metadata.pageCount = document.pages.length;
    document.metadata.imageCount = document.images.length;
    document.metadata.tableCount = document.tables.length;
    document.metadata.textBlockCount = document.pages.reduce(
      (sum, page) => sum + page.textBlocks.length,
      0
    );
    attachPerfToRawMetadata(
      document.metadata as unknown as Record<string, unknown>
    );

    return document;
  }

  private async extractImages(input: {
    jobId: string;
    jobDir: string;
    documents: LoadedDocument[];
  }): Promise<RawDocument> {
    const pages: RawPage[] = [];
    const images: RawImageRef[] = [];
    const tables: RawTable[] = [];

    const workerCount = Math.min(
      Math.max(1, input.documents.length),
      getOcrPageConcurrency()
    );
    const workers = await acquireOcrWorkers(workerCount);

    try {
      // Bounded parallel page OCR — preserve page order in results.
      const results: Array<{
        page: RawPage;
        images: RawImageRef[];
        tables: RawTable[];
      }> = new Array(input.documents.length);

      let nextIndex = 0;
      async function runOne(worker: TesseractWorker) {
        while (nextIndex < input.documents.length) {
          const index = nextIndex;
          nextIndex += 1;
          const pageNumber = index + 1;
          const single = await extractImagePage({
            jobId: input.jobId,
            jobDir: input.jobDir,
            document: input.documents[index],
            pageNumber,
            worker,
          });
          results[index] = {
            page: single.pages[0],
            images: single.images,
            tables: single.tables,
          };
        }
      }

      await Promise.all(workers.map((w) => runOne(w)));

      for (const result of results) {
        if (!result) continue;
        pages.push(result.page);
        images.push(...result.images);
        tables.push(...result.tables);
      }
    } finally {
      await releaseOcrWorkers(workers);
    }

    return {
      version: 1,
      metadata: {
        jobId: input.jobId,
        sourceFilename: `${input.documents.length}-page session`,
        sourceMimeType: input.documents[0]?.mimeType ?? "image/png",
        engine: this.name,
        extractedAt: new Date().toISOString(),
        pageCount: pages.length,
        imageCount: images.length,
        tableCount: tables.length,
        textBlockCount: pages.reduce(
          (sum, page) => sum + page.textBlocks.length,
          0
        ),
        durationMs: 0,
      },
      pages,
      images,
      tables,
    };
  }

  private async extractImage(input: {
    jobId: string;
    jobDir: string;
    document: LoadedDocument;
    pageNumber?: number;
  }): Promise<RawDocument> {
    return extractImagePage({
      ...input,
      pageNumber: input.pageNumber ?? 1,
    });
  }

  private async extractPdf(input: {
    jobId: string;
    jobDir: string;
    document: LoadedDocument;
  }): Promise<RawDocument> {
    const data = new Uint8Array(input.document.buffer);
    const wasmUrl = resolvePdfJsWasmUrl();
    perfMark("pdf_load");
    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
      wasmUrl,
      useWasm: true,
    });
    const pdf = await loadingTask.promise;
    perfMeasure("pdf_load_ms", "pdf_load");

    type PageDraft = {
      pageNumber: number;
      textBlocks: RawTextBlock[];
      pageWidth: number;
      pageHeight: number;
      pageImagePath: string | null;
      pageImageIds: string[];
      rasterStats?: RawPage["raster"];
      needsOcr: boolean;
      rasterAbsolutePath?: string;
      rasterPngBuffer?: Buffer;
      rasterBlank?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfPage: any;
    };

    const drafts: PageDraft[] = [];
    let activeWorkers: TesseractWorker[] = [];
    const workerIds = new WeakMap<TesseractWorker, string>();

    try {
      // Pass 1: native text layer for every page (skip OCR when usable).
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const textBlocks: RawTextBlock[] = [];
        let blockIndex = 0;

        const textContent = await page.getTextContent();
        for (const rawItem of textContent.items) {
          const item = rawItem as PdfJsTextItem;
          const text = safeTrim(item.str);
          if (!text) continue;

          const transform = item.transform ?? [];
          const x = transform[4] ?? 0;
          const yFromBottom = transform[5] ?? 0;
          const fontHeight = Math.abs(transform[3] ?? transform[0] ?? 12);
          const width =
            typeof item.width === "number" ? item.width : text.length * 6;
          const height = fontHeight || 12;
          const y = viewport.height - yFromBottom - height;

          blockIndex += 1;
          textBlocks.push({
            id: `p${pageNumber}-t${blockIndex}`,
            pageNumber,
            text,
            bbox: createBoundingBox(x, y, width, height),
            confidence: 1,
          });
        }

        drafts.push({
          pageNumber,
          textBlocks,
          pageWidth: viewport.width,
          pageHeight: viewport.height,
          pageImagePath: null,
          pageImageIds: [],
          needsOcr: !isPageTextUsable(null, textBlocks),
          pdfPage: page,
        });
      }

      const images: RawImageRef[] = [];
      const ocrTargets = drafts.filter((d) => d.needsOcr);

      const workerCount =
        ocrTargets.length > 0
          ? Math.min(Math.max(1, ocrTargets.length), getOcrPageConcurrency())
          : 0;
      // Overlap worker create with sequential rasterization.
      perfMark("worker_init");
      const workerWarmPromise =
        workerCount > 0
          ? acquireOcrWorkers(workerCount).then((workers) => {
              perfMeasure("ocr_worker_init_ms", "worker_init");
              workers.forEach((w, i) => {
                workerIds.set(w, `w${i + 1}`);
              });
              return workers;
            })
          : Promise.resolve([] as TesseractWorker[]);

      // Pass 2+3: sequential raster (pdf.js is not safely concurrent) while
      // OCR consumers pull pages as soon as each raster is ready. This overlaps
      // later-page rasterization with earlier-page Tesseract without changing
      // OCR quality or pdf.js concurrency.
      type OcrJob = {
        draft: PageDraft;
        source: string | Buffer;
      };
      const ocrQueue: OcrJob[] = [];
      let ocrQueueClosed = false;
      const ocrWaiters: Array<(job: OcrJob | null) => void> = [];
      const enqueueOcr = (job: OcrJob) => {
        const waiter = ocrWaiters.shift();
        if (waiter) waiter(job);
        else ocrQueue.push(job);
      };
      const closeOcrQueue = () => {
        ocrQueueClosed = true;
        while (ocrWaiters.length > 0) {
          const job = ocrQueue.shift() ?? null;
          ocrWaiters.shift()?.(job);
        }
      };
      const takeOcrJob = (): Promise<OcrJob | null> => {
        const queued = ocrQueue.shift();
        if (queued) return Promise.resolve(queued);
        if (ocrQueueClosed) return Promise.resolve(null);
        return new Promise((resolve) => {
          ocrWaiters.push(resolve);
        });
      };

      const ocrConsumerPromise = (async () => {
        activeWorkers = await workerWarmPromise;
        perfSetActiveWorkers(activeWorkers.length);
        if (activeWorkers.length === 0) {
          // Still drain if rasters enqueue while workers failed to start.
          closeOcrQueue();
          return;
        }
        await Promise.all(
          activeWorkers.map(async (worker) => {
            const wid = workerIds.get(worker) ?? "w?";
            for (;;) {
              const job = await takeOcrJob();
              if (!job) break;
              job.draft.textBlocks = await recognizeImageText(
                job.source,
                job.draft.pageNumber,
                job.draft.pageWidth,
                job.draft.pageHeight,
                worker,
                wid
              );
              job.draft.rasterPngBuffer = undefined;
            }
          })
        );
      })();

      const rasterResults: RawImageRef[] = [];
      const imageSavePromises: Promise<void>[] = [];
      try {
        for (const draft of ocrTargets) {
          const tRaster0 = Date.now();
          const raster = await rasterizePdfPage({
            page: draft.pdfPage,
            jobDir: input.jobDir,
            pageNumber: draft.pageNumber,
            scale: SCAN_RASTER_SCALE,
          });
          const rasterMs = Date.now() - tRaster0;
          perfPageRaster(draft.pageNumber, rasterMs);

          draft.pageWidth = raster.width;
          draft.pageHeight = raster.height;
          draft.pageImagePath = raster.relativePath;
          draft.rasterStats = raster.quality;
          draft.rasterAbsolutePath = raster.absolutePath;
          draft.rasterPngBuffer = raster.pngBuffer;
          draft.rasterBlank = raster.quality.blank;

          // Deterministic image id so OCR can proceed before WebP conversion finishes.
          const imageId = `image-${draft.pageNumber}`;
          draft.pageImageIds.push(imageId);

          // WebP evidence copy is off the OCR critical path (uses known dimensions).
          const tConv0 = Date.now();
          imageSavePromises.push(
            saveExtractedImage({
              jobDir: input.jobDir,
              index: draft.pageNumber,
              pageNumber: draft.pageNumber,
              sourceBuffer: raster.pngBuffer,
              bbox: pageFullBoundingBox(raster.width, raster.height),
              width: raster.width,
              height: raster.height,
            }).then((savedImage) => {
              rasterResults.push({
                id: savedImage.id,
                pageNumber: draft.pageNumber,
                path: savedImage.relativePath,
                bbox: savedImage.bbox,
                width: savedImage.width,
                height: savedImage.height,
                mimeType: savedImage.mimeType,
              });
              perfAdd("image_conversion_ms", Date.now() - tConv0);
            })
          );

          if (!draft.rasterBlank) {
            const source = draft.rasterAbsolutePath ?? draft.rasterPngBuffer;
            if (source) {
              enqueueOcr({ draft, source });
            }
            // Path-based OCR no longer needs the in-memory PNG; drop it to
            // reduce peak RSS while workers recognize earlier pages.
            if (draft.rasterAbsolutePath) {
              draft.rasterPngBuffer = undefined;
            }
          } else {
            draft.rasterPngBuffer = undefined;
          }
        }
      } catch (error) {
        closeOcrQueue();
        activeWorkers = await workerWarmPromise;
        await ocrConsumerPromise.catch(() => undefined);
        throw error;
      }

      closeOcrQueue();
      await ocrConsumerPromise;
      await Promise.all(imageSavePromises);
      // Preserve page order in images[] (saves may complete out of order).
      rasterResults.sort((a, b) => a.pageNumber - b.pageNumber);
      for (const img of rasterResults) {
        images.push(img);
      }

      // Pass 4: assemble pages + light table geometry.
      const pages: RawPage[] = [];
      const tables: RawTable[] = [];
      perfMark("reading_order");
      for (const draft of drafts) {
        const tPost0 = Date.now();
        const pageText = safeTrim(
          draft.textBlocks.map((block) => block.text).join(" ")
        );
        const layout = buildPageLayout(
          draft.pageNumber,
          draft.pageWidth,
          draft.pageHeight,
          draft.textBlocks,
          draft.pageImageIds
        );

        pages.push({
          pageNumber: draft.pageNumber,
          width: draft.pageWidth,
          height: draft.pageHeight,
          imagePath: draft.pageImagePath,
          text: pageText,
          textBlocks: draft.textBlocks,
          layout,
          ...(draft.rasterStats ? { raster: draft.rasterStats } : {}),
        });

        const pageTables = await detectSimpleTables(
          input.jobDir,
          draft.pageNumber,
          draft.textBlocks,
          draft.pageWidth,
          draft.pageHeight
        );
        tables.push(...pageTables);
        perfPagePostOcr(draft.pageNumber, Date.now() - tPost0);
      }
      perfMeasure("reading_order_ms", "reading_order");

      return {
        version: 1,
        metadata: {
          jobId: input.jobId,
          sourceFilename: input.document.filename,
          sourceMimeType: input.document.mimeType,
          engine: this.name,
          extractedAt: new Date().toISOString(),
          pageCount: pages.length,
          imageCount: images.length,
          tableCount: tables.length,
          textBlockCount: pages.reduce(
            (sum, page) => sum + page.textBlocks.length,
            0
          ),
          durationMs: 0,
        },
        pages,
        images,
        tables,
      };
    } finally {
      if (activeWorkers.length > 0) {
        perfMark("worker_release");
        await releaseOcrWorkers(activeWorkers);
        perfMeasure("worker_release_ms", "worker_release");
        activeWorkers = [];
        perfSetActiveWorkers(0);
      }
      // Release pdf.js page proxies + document (mirrors pdf-page-count.ts).
      for (const draft of drafts) {
        try {
          draft.pdfPage?.cleanup?.();
        } catch {
          // best-effort
        }
        draft.pdfPage = null;
        draft.rasterPngBuffer = undefined;
      }
      try {
        await pdf.cleanup();
      } catch {
        // best-effort
      }
      try {
        const maybeDestroy = pdf as { destroy?: () => Promise<void> };
        await maybeDestroy.destroy?.();
      } catch {
        // best-effort
      }
    }
  }
}

/**
 * Rasterize a PDF page to PNG when the text layer is empty (scanned PDFs).
 */
async function rasterizePdfPage(input: {
  // pdf.js page proxy — keep loose so we don't fight RenderParameters version drift
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any;
  jobDir: string;
  pageNumber: number;
  scale: number;
}): Promise<{
  absolutePath: string;
  relativePath: string;
  width: number;
  height: number;
  pngBuffer: Buffer;
  quality: {
    pngBytes: number;
    nonWhiteSampled: number;
    blank: boolean;
  };
}> {
  // Load outside Turbopack bundling (see native-canvas.ts + serverExternalPackages).
  const { createCanvas } = loadNativeCanvas();
  const viewport = input.page.getViewport({ scale: input.scale });
  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  );
  const context = canvas.getContext("2d");

  await input.page.render({
    canvasContext: context,
    canvas,
    viewport,
  }).promise;

  const pngBuffer = Buffer.from(await canvas.encode("png"));
  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);
  let nonWhiteSampled = 0;
  try {
    const imageData = (
      context as {
        getImageData?: (
          x: number,
          y: number,
          w: number,
          h: number
        ) => { data: Uint8ClampedArray };
      }
    ).getImageData?.(0, 0, width, height);
    nonWhiteSampled = sampleNonWhitePixels(imageData?.data);
  } catch {
    nonWhiteSampled = 0;
  }
  const quality = assessRasterPixels({
    pngBytes: pngBuffer.length,
    width,
    height,
    nonWhiteSampled,
  });
  const raster = await writePageRaster({
    jobDir: input.jobDir,
    pageNumber: input.pageNumber,
    pngBuffer,
    width,
    height,
  });

  return {
    absolutePath: raster.absolutePath,
    relativePath: raster.relativePath,
    width: raster.width,
    height: raster.height,
    pngBuffer,
    quality: {
      pngBytes: quality.pngBytes,
      nonWhiteSampled: quality.nonWhiteSampled,
      blank: quality.blank,
    },
  };
}

async function extractImagePage(input: {
  jobId: string;
  jobDir: string;
  document: LoadedDocument;
  pageNumber: number;
  worker?: TesseractWorker;
}): Promise<RawDocument> {
  const pageNumber = input.pageNumber;
  const pageRaster = await extractImageAsPage(
    input.document,
    input.jobDir,
    pageNumber
  );
  const savedImage = await saveExtractedImage({
    jobDir: input.jobDir,
    index: pageNumber,
    pageNumber,
    sourceBuffer: input.document.buffer,
    bbox: pageFullBoundingBox(pageRaster.width, pageRaster.height),
  });

  // Prefer original buffer when already PNG/JPEG-compatible for Tesseract;
  // fall back to the written page raster path.
  const ocrSource =
    input.document.mimeType === "image/png" ||
    input.document.mimeType === "image/jpeg"
      ? input.document.buffer
      : pageRaster.absolutePath;

  const textBlocks = await recognizeImageText(
    ocrSource,
    pageNumber,
    pageRaster.width,
    pageRaster.height,
    input.worker
  );

  const pageText = safeTrim(textBlocks.map((block) => block.text).join("\n"));
  const layout = buildPageLayout(
    pageNumber,
    pageRaster.width,
    pageRaster.height,
    textBlocks,
    [savedImage.id]
  );

  const page: RawPage = {
    pageNumber,
    width: pageRaster.width,
    height: pageRaster.height,
    imagePath: pageRaster.relativePath,
    text: pageText,
    textBlocks,
    layout,
  };

  const imageRef: RawImageRef = {
    id: savedImage.id,
    pageNumber,
    path: savedImage.relativePath,
    bbox: savedImage.bbox,
    width: savedImage.width,
    height: savedImage.height,
    mimeType: savedImage.mimeType,
  };

  const tables = await detectSimpleTables(
    input.jobDir,
    pageNumber,
    textBlocks,
    pageRaster.width,
    pageRaster.height
  );

  return {
    version: 1,
    metadata: {
      jobId: input.jobId,
      sourceFilename: input.document.filename,
      sourceMimeType: input.document.mimeType,
      engine: "local-ocr-v1",
      extractedAt: new Date().toISOString(),
      pageCount: 1,
      imageCount: 1,
      tableCount: tables.length,
      textBlockCount: textBlocks.length,
      durationMs: 0,
    },
    pages: [page],
    images: [imageRef],
    tables,
  };
}

async function recognizeImageText(
  imageSource: string | Buffer,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  sharedWorker?: TesseractWorker,
  workerId = "w1"
): Promise<RawTextBlock[]> {
  const ownsWorker = !sharedWorker;
  const tInit0 = Date.now();
  const worker = sharedWorker ?? (await createWorker("eng"));
  if (ownsWorker) {
    perfAdd("ocr_worker_init_ms", Date.now() - tInit0);
  }

  try {
    // tesseract.js v7 omits structured layout unless output options are requested.
    // Profiled: blocks-only matches blocks+hocr+tsv wall time; we only consume
    // text + line bboxes/confidence from blocks (and text fallback).
    // Prefer Buffer when available to avoid a second disk read of the page raster.
    const tRec0 = Date.now();
    const result = await worker.recognize(
      imageSource,
      {},
      { text: true, blocks: true }
    );
    perfPageOcr(pageNumber, workerId, Date.now() - tRec0);

    const tExtract0 = Date.now();
    const blocks: RawTextBlock[] = [];
    let index = 0;

    const layoutBlocks = (
      result.data as {
        blocks?: Array<{
          paragraphs?: Array<{
            lines?: Array<{
              text?: string;
              confidence?: number;
              bbox?: { x0: number; y0: number; x1: number; y1: number };
            }>;
          }>;
        }>;
      }
    ).blocks;

    if (Array.isArray(layoutBlocks)) {
      for (const layoutBlock of layoutBlocks) {
        for (const paragraph of layoutBlock.paragraphs ?? []) {
          for (const line of paragraph.lines ?? []) {
            const text = safeTrim(line.text);
            if (!text) continue;
            index += 1;
            const box = line.bbox;
            blocks.push({
              id: `p${pageNumber}-t${index}`,
              pageNumber,
              text,
              bbox: createBoundingBox(
                box?.x0 ?? 0,
                box?.y0 ?? 0,
                Math.max(1, (box?.x1 ?? 0) - (box?.x0 ?? 0)),
                Math.max(1, (box?.y1 ?? 0) - (box?.y0 ?? 0))
              ),
              confidence:
                typeof line.confidence === "number"
                  ? Math.max(0, Math.min(1, line.confidence / 100))
                  : undefined,
            });
          }
        }
      }
    }

    // Legacy fallback if a future API restores top-level lines.
    const lineData = (
      result.data as {
        lines?: Array<{
          text?: string;
          confidence?: number;
          bbox?: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }
    ).lines;

    if (blocks.length === 0 && Array.isArray(lineData) && lineData.length > 0) {
      for (const line of lineData) {
        const text = safeTrim(line.text);
        if (!text) continue;
        index += 1;
        const box = line.bbox;
        blocks.push({
          id: `p${pageNumber}-t${index}`,
          pageNumber,
          text,
          bbox: createBoundingBox(
            box?.x0 ?? 0,
            box?.y0 ?? 0,
            Math.max(1, (box?.x1 ?? 0) - (box?.x0 ?? 0)),
            Math.max(1, (box?.y1 ?? 0) - (box?.y0 ?? 0))
          ),
          confidence:
            typeof line.confidence === "number"
              ? Math.max(0, Math.min(1, line.confidence / 100))
              : undefined,
        });
      }
    }

    const fullPageText = safeTrim(result.data.text);
    if (blocks.length === 0 && fullPageText) {
      const paragraphs = fullPageText
        .split(/\n+/)
        .map((line) => safeTrim(line))
        .filter(Boolean);

      for (let i = 0; i < paragraphs.length; i += 1) {
        index += 1;
        const syntheticY = Math.round(
          (pageHeight * (i + 1)) / (paragraphs.length + 1)
        );
        blocks.push({
          id: `p${pageNumber}-t${index}`,
          pageNumber,
          text: paragraphs[i],
          bbox: createBoundingBox(
            0,
            syntheticY,
            Math.max(1, pageWidth),
            Math.max(12, Math.round(pageHeight / (paragraphs.length + 2)))
          ),
          confidence:
            typeof result.data.confidence === "number"
              ? Math.max(0, Math.min(1, result.data.confidence / 100))
              : undefined,
        });
      }
    }

    perfAdd("ocr_result_extract_ms", Date.now() - tExtract0);
    return blocks;
  } finally {
    if (ownsWorker) {
      perfMark("worker_release_single");
      await worker.terminate();
      perfMeasure("worker_release_ms", "worker_release_single");
    }
  }
}

function buildPageLayout(
  pageNumber: number,
  width: number,
  height: number,
  textBlocks: RawTextBlock[],
  imageIds: string[]
): PageLayout {
  return {
    pageNumber,
    width,
    height,
    blocks: [
      ...textBlocks.map((block) => ({
        id: block.id,
        kind: "text" as const,
        pageNumber,
        bbox: block.bbox,
        confidence: block.confidence,
      })),
      ...imageIds.map((id) => ({
        id,
        kind: "image" as const,
        pageNumber,
        bbox: pageFullBoundingBox(width, height),
      })),
    ],
  };
}

/**
 * Lightweight heuristic table detection from aligned text lines.
 * Produces geometry-only tables — no academic interpretation.
 */
async function detectSimpleTables(
  jobDir: string,
  pageNumber: number,
  textBlocks: RawTextBlock[],
  pageWidth: number,
  pageHeight: number
): Promise<RawTable[]> {
  if (textBlocks.length < 4) {
    return [];
  }

  const lines = new Map<number, RawTextBlock[]>();

  for (const block of textBlocks) {
    const key = Math.round(block.bbox.y / 8) * 8;
    const bucket = lines.get(key) ?? [];
    bucket.push(block);
    lines.set(key, bucket);
  }

  const multiColumnLines = [...lines.values()].filter(
    (lineBlocks) => lineBlocks.length >= 2
  );

  if (multiColumnLines.length < 2) {
    return [];
  }

  const cells = multiColumnLines.flatMap((lineBlocks, row) => {
    const sorted = [...lineBlocks].sort((a, b) => a.bbox.x - b.bbox.x);
    return sorted.map((block, column) => ({
      row,
      column,
      text: block.text,
      bbox: block.bbox,
    }));
  });

  const columns = Math.max(...cells.map((cell) => cell.column)) + 1;
  const rows = Math.max(...cells.map((cell) => cell.row)) + 1;

  const tableId = `table-p${pageNumber}-1`;
  const relativePath = `${CMS_JOB_TABLES_DIR}/${tableId}.json`;
  const tablesDir = path.join(jobDir, CMS_JOB_TABLES_DIR);
  await fs.mkdir(tablesDir, { recursive: true });

  const table: RawTable = {
    id: tableId,
    pageNumber,
    path: relativePath,
    bbox: pageFullBoundingBox(pageWidth, pageHeight),
    rows,
    columns,
    cells,
  };

  await fs.writeFile(
    path.join(jobDir, relativePath),
    JSON.stringify(table, null, 2) + "\n",
    "utf8"
  );

  return [table];
}

export function createDefaultOcrEngine(): OcrEngine {
  return new LocalOcrEngine();
}
