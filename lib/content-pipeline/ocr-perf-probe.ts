/**
 * Temporary / internal OCR pipeline performance probe.
 * Enable with CMS_OCR_PROFILE=1. No-op when disabled.
 */

import os from "node:os";

export type PagePerfRecord = {
  pageNumber: number;
  workerId: string;
  rasterMs: number;
  ocrMs: number;
  postOcrMs: number;
};

export type OcrPerfSnapshot = {
  stages: Record<string, number>;
  pages: PagePerfRecord[];
  activeWorkers: number;
  configuredConcurrency: number;
  cpuCount: number;
  rssBeforeMb: number;
  rssAfterMb: number;
  heapUsedMb: number;
  peakRssMb: number;
};

type MutableProbe = {
  enabled: boolean;
  stages: Record<string, number>;
  pages: Map<number, PagePerfRecord>;
  activeWorkers: number;
  configuredConcurrency: number;
  rssBefore: number;
  peakRss: number;
  marks: Map<string, number>;
};

const probe: MutableProbe = {
  enabled: false,
  stages: {},
  pages: new Map(),
  activeWorkers: 0,
  configuredConcurrency: 0,
  rssBefore: 0,
  peakRss: 0,
  marks: new Map(),
};

function rssBytes(): number {
  return process.memoryUsage().rss;
}

function trackRss(): void {
  const rss = rssBytes();
  if (rss > probe.peakRss) probe.peakRss = rss;
}

export function isOcrPerfEnabled(): boolean {
  return (
    process.env.CMS_OCR_PROFILE === "1" ||
    process.env.CMS_OCR_PROFILE === "true"
  );
}

export function resetOcrPerfProbe(configuredConcurrency = 0): void {
  probe.enabled = isOcrPerfEnabled();
  probe.stages = {};
  probe.pages = new Map();
  probe.activeWorkers = 0;
  probe.configuredConcurrency = configuredConcurrency;
  probe.rssBefore = rssBytes();
  probe.peakRss = probe.rssBefore;
  probe.marks = new Map();
}

export function perfMark(name: string): void {
  if (!probe.enabled) return;
  probe.marks.set(name, Date.now());
  trackRss();
}

export function perfMeasure(stage: string, fromMark: string): number {
  if (!probe.enabled) return 0;
  const start = probe.marks.get(fromMark);
  if (start == null) return 0;
  const ms = Date.now() - start;
  probe.stages[stage] = (probe.stages[stage] ?? 0) + ms;
  trackRss();
  return ms;
}

export function perfAdd(stage: string, ms: number): void {
  if (!probe.enabled) return;
  probe.stages[stage] = (probe.stages[stage] ?? 0) + ms;
  trackRss();
}

export function perfTimed<T>(stage: string, fn: () => Promise<T>): Promise<T>;
export function perfTimed<T>(stage: string, fn: () => T): T;
export function perfTimed<T>(
  stage: string,
  fn: (() => T) | (() => Promise<T>)
): T | Promise<T> {
  if (!probe.enabled) return fn();
  const t0 = Date.now();
  const result = fn();
  if (result && typeof (result as Promise<T>).then === "function") {
    return (result as Promise<T>).finally(() => {
      perfAdd(stage, Date.now() - t0);
    });
  }
  perfAdd(stage, Date.now() - t0);
  return result;
}

function ensurePage(pageNumber: number): PagePerfRecord {
  let page = probe.pages.get(pageNumber);
  if (!page) {
    page = {
      pageNumber,
      workerId: "",
      rasterMs: 0,
      ocrMs: 0,
      postOcrMs: 0,
    };
    probe.pages.set(pageNumber, page);
  }
  return page;
}

export function perfPageRaster(pageNumber: number, ms: number): void {
  if (!probe.enabled) return;
  ensurePage(pageNumber).rasterMs += ms;
  perfAdd("pdf_page_raster_ms", ms);
}

export function perfPageOcr(
  pageNumber: number,
  workerId: string,
  ms: number
): void {
  if (!probe.enabled) return;
  const page = ensurePage(pageNumber);
  page.workerId = workerId;
  page.ocrMs += ms;
  perfAdd("tesseract_recognize_ms", ms);
}

export function perfPagePostOcr(pageNumber: number, ms: number): void {
  if (!probe.enabled) return;
  ensurePage(pageNumber).postOcrMs += ms;
  perfAdd("ocr_result_extract_ms", ms);
}

export function perfSetActiveWorkers(n: number): void {
  if (!probe.enabled) return;
  probe.activeWorkers = n;
}

export function snapshotOcrPerf(): OcrPerfSnapshot | null {
  if (!probe.enabled) return null;
  trackRss();
  const mem = process.memoryUsage();
  return {
    stages: { ...probe.stages },
    pages: [...probe.pages.values()].sort(
      (a, b) => a.pageNumber - b.pageNumber
    ),
    activeWorkers: probe.activeWorkers,
    configuredConcurrency: probe.configuredConcurrency,
    cpuCount: os.cpus().length,
    rssBeforeMb: Math.round(probe.rssBefore / (1024 * 1024)),
    rssAfterMb: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
    peakRssMb: Math.round(probe.peakRss / (1024 * 1024)),
  };
}

export function attachPerfToRawMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
): void {
  const snap = snapshotOcrPerf();
  if (!snap) return;
  metadata.perf = snap;
}
