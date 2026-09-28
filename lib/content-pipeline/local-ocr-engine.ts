import fs from "fs/promises";
import { createRequire } from "node:module";
import path from "path";
import { pathToFileURL } from "node:url";

import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { CMS_JOB_TABLES_DIR } from "./constants";
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
import { safeTrim } from "./string-normalize";

/**
 * pdf.js needs an absolute URL (trailing slash) for JBIG2/OpenJPEG/QCMS
 * wasm assets. Without wasmUrl, scanned JBIG2 pages rasterize blank.
 */
function resolvePdfJsWasmUrl(): string {
  const requireFromProject = createRequire(
    path.join(process.cwd(), "package.json")
  );
  const pdfjsEntry = requireFromProject.resolve("pdfjs-dist/package.json");
  const wasmDir = path.join(path.dirname(pdfjsEntry), "wasm");
  return pathToFileURL(wasmDir + path.sep).href;
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

    for (let index = 0; index < input.documents.length; index += 1) {
      const pageNumber = index + 1;
      const single = await this.extractImage({
        jobId: input.jobId,
        jobDir: input.jobDir,
        document: input.documents[index],
        pageNumber,
      });
      pages.push(...single.pages);
      images.push(...single.images);
      tables.push(...single.tables);
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
    const pageNumber = input.pageNumber ?? 1;
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

    const textBlocks = await recognizeImageText(
      pageRaster.absolutePath,
      pageNumber,
      pageRaster.width,
      pageRaster.height
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
        engine: this.name,
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

  private async extractPdf(input: {
    jobId: string;
    jobDir: string;
    document: LoadedDocument;
  }): Promise<RawDocument> {
    const data = new Uint8Array(input.document.buffer);
    const wasmUrl = resolvePdfJsWasmUrl();
    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
      wasmUrl,
      useWasm: true,
    });
    const pdf = await loadingTask.promise;

    const pages: RawPage[] = [];
    const images: RawImageRef[] = [];
    const tables: RawTable[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      let textBlocks: RawTextBlock[] = [];
      let blockIndex = 0;
      let pageImagePath: string | null = null;
      let pageWidth = viewport.width;
      let pageHeight = viewport.height;
      const pageImageIds: string[] = [];

      for (const rawItem of textContent.items) {
        const item = rawItem as PdfJsTextItem;
        const text = safeTrim(item.str);
        if (!text) {
          continue;
        }

        const transform = item.transform ?? [];
        const x = transform[4] ?? 0;
        const yFromBottom = transform[5] ?? 0;
        const fontHeight = Math.abs(transform[3] ?? transform[0] ?? 12);
        const width =
          typeof item.width === "number" ? item.width : text.length * 6;
        const height = fontHeight || 12;
        // PDF origin is bottom-left; convert to top-left for consistency.
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

      let rasterStats: RawPage["raster"];

      if (!isPageTextUsable(null, textBlocks)) {
        const raster = await rasterizePdfPage({
          page,
          jobDir: input.jobDir,
          pageNumber,
          scale: 2,
        });
        pageWidth = raster.width;
        pageHeight = raster.height;
        pageImagePath = raster.relativePath;
        rasterStats = raster.quality;

        const savedImage = await saveExtractedImage({
          jobDir: input.jobDir,
          index: pageNumber,
          pageNumber,
          sourceBuffer: raster.pngBuffer,
          bbox: pageFullBoundingBox(raster.width, raster.height),
        });
        images.push({
          id: savedImage.id,
          pageNumber,
          path: savedImage.relativePath,
          bbox: savedImage.bbox,
          width: savedImage.width,
          height: savedImage.height,
          mimeType: savedImage.mimeType,
        });
        pageImageIds.push(savedImage.id);

        if (!raster.quality.blank) {
          textBlocks = await recognizeImageText(
            raster.absolutePath,
            pageNumber,
            raster.width,
            raster.height
          );
        }
      }
      const pageText = safeTrim(
        textBlocks.map((block) => block.text).join(" ")
      );
      const layout = buildPageLayout(
        pageNumber,
        pageWidth,
        pageHeight,
        textBlocks,
        pageImageIds
      );

      pages.push({
        pageNumber,
        width: pageWidth,
        height: pageHeight,
        imagePath: pageImagePath,
        text: pageText,
        textBlocks,
        layout,
        ...(rasterStats ? { raster: rasterStats } : {}),
      });

      const pageTables = await detectSimpleTables(
        input.jobDir,
        pageNumber,
        textBlocks,
        pageWidth,
        pageHeight
      );
      tables.push(...pageTables);
    }
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

async function recognizeImageText(
  imagePath: string,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<RawTextBlock[]> {
  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(imagePath);
    const blocks: RawTextBlock[] = [];
    let index = 0;

    const lineData = (
      result.data as {
        lines?: Array<{
          text?: string;
          confidence?: number;
          bbox?: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }
    ).lines;

    if (Array.isArray(lineData) && lineData.length > 0) {
      for (const line of lineData) {
        const text = safeTrim(line.text);
        if (!text) {
          continue;
        }

        index += 1;
        const box = line.bbox;
        blocks.push({
          id: `p${pageNumber}-t${index}`,
          pageNumber,
          text,
          bbox: createBoundingBox(
            box?.x0 ?? 0,
            box?.y0 ?? 0,
            Math.max(0, (box?.x1 ?? 0) - (box?.x0 ?? 0)),
            Math.max(0, (box?.y1 ?? 0) - (box?.y0 ?? 0))
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

      for (const text of paragraphs) {
        index += 1;
        blocks.push({
          id: `p${pageNumber}-t${index}`,
          pageNumber,
          text,
          bbox: pageFullBoundingBox(pageWidth, pageHeight),
          confidence:
            typeof result.data.confidence === "number"
              ? Math.max(0, Math.min(1, result.data.confidence / 100))
              : undefined,
        });
      }
    }

    return blocks;
  } finally {
    await worker.terminate();
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
