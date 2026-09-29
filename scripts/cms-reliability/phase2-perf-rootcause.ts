/**
 * Phase 2 performance root-cause investigation.
 *
 * DO NOT COMMIT results. Measures stages independently, concurrency 1–4,
 * raster-only / OCR-only / combined, JBIG2 wasm, worker lifecycle, memory.
 *
 * Usage:
 *   CMS_OCR_PROFILE=1 node --import tsx scripts/cms-reliability/phase2-perf-rootcause.ts
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";

import { loadDocumentFile } from "../../lib/content-pipeline/document-loader";
import {
  getResolvedPdfJsWasmUrl,
  LocalOcrEngine,
  SCAN_RASTER_SCALE,
} from "../../lib/content-pipeline/local-ocr-engine";
import { buildStructuredDocument } from "../../lib/content-pipeline/structure-builder";
import { buildExtractionEvidence } from "../../lib/content-pipeline/extraction-evidence";
import {
  academicFromEvidence,
  validateAgainstEvidence,
} from "../../lib/content-pipeline/evidence-validator";
import { buildProductionPyqs } from "../../lib/content-pipeline/pyq-schema-builder";
import { snapshotOcrPerf } from "../../lib/content-pipeline/ocr-perf-probe";
import { availableRealDocumentFixtures } from "./fixtures/real-document-registry";

process.env.CMS_OCR_PROFILE = "1";

type Stats = { min: number; avg: number; max: number; n: number };

function stats(values: number[]): Stats {
  if (values.length === 0) return { min: 0, avg: 0, max: 0, n: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, avg, max, n: values.length };
}

function fmtMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtStats(s: Stats): string {
  return `min=${fmtMs(s.min)} avg=${fmtMs(s.avg)} max=${fmtMs(s.max)} (n=${s.n})`;
}

function rssMb(): number {
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
}

function fixture(id: string): string {
  const f = availableRealDocumentFixtures().find((x) => x.id === id);
  if (!f?.path) throw new Error(`Missing fixture: ${id}`);
  return f.path;
}

async function runCombinedOnce(absolutePath: string): Promise<{
  totalMs: number;
  ocrMs: number;
  postOcrMs: number;
  stages: Record<string, number>;
  pages: Array<{
    pageNumber: number;
    workerId: string;
    rasterMs: number;
    ocrMs: number;
    postOcrMs: number;
  }>;
  activeWorkers: number;
  concurrency: number;
  rssBefore: number;
  rssAfter: number;
  peakRss: number;
  heapUsed: number;
  pagesCount: number;
  textBlocks: number;
}> {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "hlt-rc-"));
  const document = await loadDocumentFile(absolutePath);
  const engine = new LocalOcrEngine();
  const t0 = Date.now();
  const raw = await engine.extract({
    jobId: `rc_${Date.now()}`,
    jobDir,
    document,
  });
  const t1 = Date.now();

  const structured = buildStructuredDocument(raw);
  const evidence = buildExtractionEvidence({
    raw,
    structured,
    declaredPaperCount: 1,
  });
  const academic = academicFromEvidence(evidence, {
    metadata: {
      jobId: "rc",
      jobType: "pyq",
      sourceFilename: path.basename(absolutePath),
      subjectCode: "RC",
      subjectName: null,
      subjectTitle: null,
      branch: null,
      semester: null,
      university: null,
      structuredAt: new Date().toISOString(),
      model: "rc",
      detector: "rc",
    },
    exam: {
      exam: "RC",
      year: 2025,
      month: "June",
      maxMarks: 70,
      time: "3 Hours",
      commonInstructions: [],
      isPredicted: null,
      gradingSystem: null,
    },
  });
  validateAgainstEvidence(academic, evidence);
  buildProductionPyqs(academic);
  const t2 = Date.now();

  const perf =
    (raw.metadata as { perf?: ReturnType<typeof snapshotOcrPerf> }).perf ??
    snapshotOcrPerf();

  try {
    fs.rmSync(jobDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return {
    totalMs: t2 - t0,
    ocrMs: t1 - t0,
    postOcrMs: t2 - t1,
    stages: perf?.stages ?? {},
    pages: perf?.pages ?? [],
    activeWorkers: perf?.activeWorkers ?? 0,
    concurrency:
      perf?.configuredConcurrency ??
      Number(process.env.CMS_OCR_PAGE_CONCURRENCY || 3),
    rssBefore: perf?.rssBeforeMb ?? 0,
    rssAfter: perf?.rssAfterMb ?? rssMb(),
    peakRss: perf?.peakRssMb ?? 0,
    heapUsed: perf?.heapUsedMb ?? 0,
    pagesCount: raw.pages.length,
    textBlocks: raw.metadata.textBlockCount,
  };
}

async function rasterOnly(
  absolutePath: string
): Promise<{ totalMs: number; pageMs: number[]; wasmWarns: number }> {
  const data = new Uint8Array(fs.readFileSync(absolutePath));
  const wasmUrl = getResolvedPdfJsWasmUrl();
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...a: unknown[]) => {
    warnings.push(a.map(String).join(" "));
    origWarn(...a);
  };
  const t0 = Date.now();
  const pageMs: number[] = [];
  try {
    const pdf = await getDocument({
      data,
      useSystemFonts: true,
      wasmUrl,
      useWasm: true,
    }).promise;
    for (let p = 1; p <= pdf.numPages; p += 1) {
      const tp = Date.now();
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: SCAN_RASTER_SCALE });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx = canvas.getContext("2d");
      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        canvas: canvas as unknown as HTMLCanvasElement,
        viewport: vp,
      }).promise;
      await canvas.encode("png");
      page.cleanup?.();
      pageMs.push(Date.now() - tp);
    }
    await pdf.cleanup();
    await (pdf as { destroy?: () => Promise<void> }).destroy?.();
  } finally {
    console.warn = origWarn;
  }
  return {
    totalMs: Date.now() - t0,
    pageMs,
    wasmWarns: warnings.filter((w) =>
      /instantiateWasm|Unable to load wasm/i.test(w)
    ).length,
  };
}

async function ocrOnlyFromRasters(rasterPaths: string[]): Promise<{
  totalMs: number;
  pageMs: number[];
  initMs: number;
  releaseMs: number;
}> {
  const concurrency = Math.min(
    rasterPaths.length,
    Math.max(1, Number(process.env.CMS_OCR_PAGE_CONCURRENCY) || 3)
  );
  const tInit0 = Date.now();
  const workers = await Promise.all(
    Array.from({ length: concurrency }, () => createWorker("eng"))
  );
  const initMs = Date.now() - tInit0;
  const pageMs = new Array<number>(rasterPaths.length).fill(0);
  const t0 = Date.now();
  let next = 0;
  async function runOne(worker: Awaited<ReturnType<typeof createWorker>>) {
    while (next < rasterPaths.length) {
      const i = next;
      next += 1;
      const tp = Date.now();
      await worker.recognize(rasterPaths[i], {}, { text: true, blocks: true });
      pageMs[i] = Date.now() - tp;
    }
  }
  await Promise.all(workers.map((w) => runOne(w)));
  const totalMs = Date.now() - t0;
  const tRel0 = Date.now();
  await Promise.all(workers.map((w) => w.terminate()));
  return { totalMs, pageMs, initMs, releaseMs: Date.now() - tRel0 };
}

async function prepareRasters(
  absolutePath: string,
  outDir: string
): Promise<string[]> {
  fs.mkdirSync(outDir, { recursive: true });
  const data = new Uint8Array(fs.readFileSync(absolutePath));
  const wasmUrl = getResolvedPdfJsWasmUrl();
  const pdf = await getDocument({
    data,
    useSystemFonts: true,
    wasmUrl,
    useWasm: true,
  }).promise;
  const paths: string[] = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: SCAN_RASTER_SCALE });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext("2d");
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport: vp,
    }).promise;
    const png = Buffer.from(await canvas.encode("png"));
    const out = path.join(outDir, `page-${p}.png`);
    fs.writeFileSync(out, png);
    paths.push(out);
    page.cleanup?.();
  }
  await pdf.cleanup();
  await (pdf as { destroy?: () => Promise<void> }).destroy?.();
  return paths;
}

async function jbig2WasmCompare(absolutePath: string): Promise<void> {
  console.log("\n========== 6. JBIG2 WASM INVESTIGATION ==========");
  const requireFromProject = createRequire(
    path.join(process.cwd(), "package.json")
  );
  const pkgPath = requireFromProject.resolve("pdfjs-dist/package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    version: string;
  };
  const wasmDir = path.join(path.dirname(pkgPath), "wasm");
  const wasmFiles = fs.existsSync(wasmDir) ? fs.readdirSync(wasmDir) : [];
  console.log(`pdfjs-dist version: ${pkg.version}`);
  console.log(`Node: ${process.version}`);
  console.log(`Platform: ${process.platform} ${os.arch()}`);
  console.log(`CPU count: ${os.cpus().length}`);
  console.log(`wasm dir: ${wasmDir}`);
  console.log(`wasm files: ${wasmFiles.join(", ")}`);
  console.log(
    `jbig2.wasm exists: ${fs.existsSync(path.join(wasmDir, "jbig2.wasm"))}`
  );

  const fixedUrl = getResolvedPdfJsWasmUrl();
  const mirrorDir = path.join(os.tmpdir(), "hlt-pdfjs-wasm-v1");
  const brokenFileUrl = pathToFileURL(mirrorDir + path.sep).href;
  console.log(`FIXED wasmUrl (fs POSIX): ${fixedUrl}`);
  console.log(`BROKEN wasmUrl (file://): ${brokenFileUrl}`);

  const data = new Uint8Array(fs.readFileSync(absolutePath));

  async function timeRaster(label: string, wasmUrl: string, useWasm: boolean) {
    const warnings: string[] = [];
    const origWarn = console.warn;
    console.warn = (...a: unknown[]) => {
      warnings.push(a.map(String).join(" "));
      origWarn(...a);
    };
    const t0 = Date.now();
    try {
      const pdf = await getDocument({
        data: data.slice(),
        useSystemFonts: true,
        wasmUrl,
        useWasm,
      }).promise;
      for (let p = 1; p <= pdf.numPages; p += 1) {
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: SCAN_RASTER_SCALE });
        const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
        const ctx = canvas.getContext("2d");
        await page.render({
          canvasContext: ctx as unknown as CanvasRenderingContext2D,
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport: vp,
        }).promise;
        await canvas.encode("png");
        page.cleanup?.();
      }
      await pdf.cleanup();
      await (pdf as { destroy?: () => Promise<void> }).destroy?.();
      const wasmWarns = warnings.filter((w) =>
        /instantiateWasm|Unable to load wasm/i.test(w)
      );
      console.log(
        `${label}: ${fmtMs(Date.now() - t0)} wasmWarns=${wasmWarns.length}`
      );
      for (const w of wasmWarns.slice(0, 2)) {
        console.log(`  ${w.slice(0, 180)}`);
      }
    } catch (e) {
      console.log(
        `${label}: FAIL ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      console.warn = origWarn;
    }
  }

  await timeRaster("file:// URL (broken)", brokenFileUrl, true);
  await timeRaster("POSIX fs path (fixed)", fixedUrl, true);
  await timeRaster("useWasm=false (force JS)", fixedUrl, false);
}

async function workerLifecycleCheck(rasterPath: string): Promise<void> {
  console.log("\n========== 7. WORKER LIFECYCLE ==========");
  const before = rssMb();

  // success path
  {
    const w = await createWorker("eng");
    await w.recognize(rasterPath, {}, { text: true, blocks: true });
    await w.terminate();
    console.log("success: create→recognize→terminate OK");
  }

  // failure path: terminate after init without recognize (safe); bad-image
  // recognize can throw uncaught via worker event in tesseract.js — skip that.
  {
    const w = await createWorker("eng");
    await w.terminate();
    console.log("failure/cancel: create→terminate (no recognize) OK");
  }

  // raster-failure analogue: workers acquired then released without OCR
  {
    const workers = await Promise.all([
      createWorker("eng"),
      createWorker("eng"),
    ]);
    await Promise.all(workers.map((w) => w.terminate()));
    console.log("raster-fail analogue: acquire pool→release all OK");
  }

  const after = rssMb();
  console.log(
    `RSS before=${before}MB after=${after}MB delta=${after - before}MB`
  );
}

async function memoryStability(
  absolutePath: string,
  runs: number
): Promise<void> {
  console.log(`\n========== 8. MEMORY STABILITY (${runs}×) ==========`);
  const times: number[] = [];
  const rssSeries: number[] = [];
  console.log(`RSS start: ${rssMb()}MB`);
  for (let i = 0; i < runs; i += 1) {
    const r = await runCombinedOnce(absolutePath);
    times.push(r.totalMs);
    rssSeries.push(r.rssAfter);
    console.log(
      `  run ${i + 1}: ${fmtMs(r.totalMs)} rss=${r.rssAfter}MB peak=${r.peakRss}MB workers=${r.activeWorkers} blocks=${r.textBlocks}`
    );
  }
  const t = stats(times);
  console.log(`Time over ${runs} runs: ${fmtStats(t)}`);
  console.log(
    `RSS series: ${rssSeries.join(" → ")} (start→end delta ${rssSeries.at(-1)! - rssSeries[0]}MB)`
  );
  const degrading =
    times.length >= 4 &&
    times.slice(-3).reduce((a, b) => a + b, 0) / 3 >
      (times.slice(0, 3).reduce((a, b) => a + b, 0) / 3) * 1.5;
  console.log(
    degrading
      ? "DEGRADATION DETECTED: later runs >1.5× early runs"
      : "No significant time degradation across repeats"
  );
}

function printStageTable(
  label: string,
  samples: Awaited<ReturnType<typeof runCombinedOnce>>[]
): void {
  console.log(`\n--- Instrumented stages: ${label} ---`);
  const keys = new Set<string>();
  for (const s of samples) Object.keys(s.stages).forEach((k) => keys.add(k));
  for (const k of [...keys].sort()) {
    const vals = samples.map((s) => s.stages[k] ?? 0);
    console.log(`  ${k.padEnd(28)} ${fmtStats(stats(vals))}`);
  }
  console.log(
    `  ${"TOTAL local".padEnd(28)} ${fmtStats(stats(samples.map((s) => s.totalMs)))}`
  );
  console.log(
    `  ${"OCR engine wall".padEnd(28)} ${fmtStats(stats(samples.map((s) => s.ocrMs)))}`
  );
  console.log(
    `  ${"post-OCR (schema etc)".padEnd(28)} ${fmtStats(stats(samples.map((s) => s.postOcrMs)))}`
  );
  if (samples[0]?.pages?.length) {
    console.log("  Per-page (last run):");
    for (const p of samples.at(-1)!.pages) {
      console.log(
        `    p${p.pageNumber} worker=${p.workerId} raster=${fmtMs(p.rasterMs)} ocr=${fmtMs(p.ocrMs)} post=${fmtMs(p.postOcrMs)}`
      );
    }
  }
  const last = samples.at(-1)!;
  console.log(
    `  env: cpus=${os.cpus().length} concurrency=${last.concurrency} rss ${last.rssBefore}→${last.rssAfter}MB peak=${last.peakRss}MB heap=${last.heapUsed}MB`
  );
}

async function main(): Promise<void> {
  console.log("# Performance Root Cause Investigation");
  console.log(
    `Node ${process.version} | CPUs ${os.cpus().length} | RSS ${rssMb()}MB`
  );
  console.log(
    `CMS_OCR_PAGE_CONCURRENCY=${process.env.CMS_OCR_PAGE_CONCURRENCY ?? "(default 3)"}`
  );
  console.log(`wasmUrl=${getResolvedPdfJsWasmUrl()}`);

  const fourPage = fixture("dec2023-4page-single-paper");
  const twoPage = fixture("al402-jun-2025");
  const oneImage = fixture("cy301-page1-image");
  const jbig2 = fixture("jbig2-al-402-committed");
  const native = availableRealDocumentFixtures().find(
    (f) => f.id === "native-text-al402-sample"
  )?.path;

  // ---- 1+5 Combined instrumented baselines ----
  console.log("\n========== 1+5. INSTRUMENTED COMBINED PIPELINE ==========");
  const stageResults: Record<
    string,
    Awaited<ReturnType<typeof runCombinedOnce>>[]
  > = {};

  for (const [label, p, runs] of [
    ["1-page-image", oneImage, 3],
    ["2-page-scanned", twoPage, 3],
    ["4-page-scanned", fourPage, 3],
    ["jbig2-2page", jbig2, 3],
    ...(native ? ([["1-page-native", native, 2]] as const) : []),
  ] as Array<[string, string, number]>) {
    const samples = [];
    for (let i = 0; i < runs; i += 1) {
      samples.push(await runCombinedOnce(p));
      console.log(
        `  ${label} run${i + 1}: total=${fmtMs(samples.at(-1)!.totalMs)} ocr=${fmtMs(samples.at(-1)!.ocrMs)}`
      );
    }
    stageResults[label] = samples;
    printStageTable(label, samples);
  }

  // ---- 2. Concurrency experiment (same process; concurrency read at call time) ----
  console.log("\n========== 2. CONCURRENCY EXPERIMENT (4-page) ==========");
  const concResults: Record<number, number[]> = {};
  for (const c of [1, 2, 3, 4]) {
    process.env.CMS_OCR_PAGE_CONCURRENCY = String(c);
    concResults[c] = [];
    for (let i = 0; i < 3; i += 1) {
      const r = await runCombinedOnce(fourPage);
      concResults[c].push(r.ocrMs);
      console.log(
        `  concurrency=${c} run${i + 1}: ocr=${fmtMs(r.ocrMs)} total=${fmtMs(r.totalMs)} workers=${r.concurrency}`
      );
    }
    console.log(
      `  concurrency=${c} SUMMARY ${fmtStats(stats(concResults[c]))}`
    );
  }
  process.env.CMS_OCR_PAGE_CONCURRENCY = "3";

  // ---- 3. Raster-only ----
  console.log("\n========== 3. RASTER-ONLY (no OCR) ==========");
  for (const [label, p] of [
    ["4-page", fourPage],
    ["jbig2", jbig2],
    ["2-page", twoPage],
  ] as const) {
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      runs.push(await rasterOnly(p));
      console.log(
        `  ${label} run${i + 1}: total=${fmtMs(runs.at(-1)!.totalMs)} pages=[${runs
          .at(-1)!
          .pageMs.map(fmtMs)
          .join(", ")}] wasmWarns=${runs.at(-1)!.wasmWarns}`
      );
    }
    console.log(
      `  ${label} SUMMARY ${fmtStats(stats(runs.map((r) => r.totalMs)))}`
    );
  }

  // ---- 4. OCR-only ----
  console.log("\n========== 4. OCR-ONLY (pre-rasterized) ==========");
  const rasterDir = fs.mkdtempSync(path.join(os.tmpdir(), "hlt-rasters-"));
  const fourRasters = await prepareRasters(
    fourPage,
    path.join(rasterDir, "4p")
  );
  console.log(`Prepared ${fourRasters.length} rasters`);
  for (const c of [1, 2, 3, 4]) {
    process.env.CMS_OCR_PAGE_CONCURRENCY = String(c);
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      runs.push(await ocrOnlyFromRasters(fourRasters));
      console.log(
        `  OCR-only conc=${c} run${i + 1}: recognize=${fmtMs(runs.at(-1)!.totalMs)} init=${fmtMs(runs.at(-1)!.initMs)} release=${fmtMs(runs.at(-1)!.releaseMs)} pages=[${runs
          .at(-1)!
          .pageMs.map(fmtMs)
          .join(", ")}]`
      );
    }
    console.log(
      `  OCR-only conc=${c} SUMMARY recognize ${fmtStats(stats(runs.map((r) => r.totalMs)))}`
    );
  }
  process.env.CMS_OCR_PAGE_CONCURRENCY = "3";

  // ---- Combined vs parts for 4-page ----
  console.log("\n========== 5. COMBINED vs PARTS (4-page) ==========");
  const combined4 = stageResults["4-page-scanned"] ?? [];
  const raster4 = await rasterOnly(fourPage);
  const ocr4 = await ocrOnlyFromRasters(fourRasters);
  console.log(`Raster-only: ${fmtMs(raster4.totalMs)}`);
  console.log(
    `OCR-only (recognize wall, conc=3): ${fmtMs(ocr4.totalMs)} + init ${fmtMs(ocr4.initMs)}`
  );
  console.log(
    `Combined avg: ${fmtMs(stats(combined4.map((s) => s.totalMs)).avg)}`
  );
  const sumParts = raster4.totalMs + ocr4.totalMs + ocr4.initMs;
  console.log(
    `Raster+OCR+init sum: ${fmtMs(sumParts)} (overlap/overhead explains difference vs combined)`
  );

  await jbig2WasmCompare(jbig2);
  await workerLifecycleCheck(fourRasters[0]);
  await memoryStability(twoPage, 10);

  // ---- Summary table ----
  console.log("\n========== STAGE TABLE ==========");
  console.log(
    "| Stage | 1 page | 2 page | 4 page | JBIG2 | Primary bottleneck? |"
  );
  console.log("|---|---:|---:|---:|---:|---|");

  function avgStage(label: string, stageKey: string): string {
    const samples = stageResults[label];
    if (!samples?.length) return "n/a";
    const vals = samples.map((s) => s.stages[stageKey] ?? 0);
    return fmtMs(stats(vals).avg);
  }
  function avgTotal(label: string): string {
    const samples = stageResults[label];
    if (!samples?.length) return "n/a";
    return fmtMs(stats(samples.map((s) => s.totalMs)).avg);
  }
  function avgOcr(label: string): string {
    const samples = stageResults[label];
    if (!samples?.length) return "n/a";
    return fmtMs(
      stats(samples.map((s) => s.stages.tesseract_recognize_ms ?? s.ocrMs)).avg
    );
  }
  function avgRaster(label: string): string {
    return avgStage(label, "pdf_page_raster_ms");
  }

  const labels = {
    "1p": "1-page-image",
    "2p": "2-page-scanned",
    "4p": "4-page-scanned",
    j: "jbig2-2page",
  } as const;

  const rows: Array<[string, string, boolean]> = [
    ["PDF load", "pdf_load_ms", false],
    ["PDF page raster", "pdf_page_raster_ms", false],
    ["Image conversion", "image_conversion_ms", false],
    ["OCR worker init", "ocr_worker_init_ms", false],
    ["Tesseract recognize", "tesseract_recognize_ms", true],
    ["Worker release", "worker_release_ms", false],
    ["Reading order/post", "reading_order_ms", false],
    ["TOTAL local", "__total__", false],
  ];

  for (const [name, key] of rows) {
    const cells =
      key === "__total__"
        ? [
            avgTotal(labels["1p"]),
            avgTotal(labels["2p"]),
            avgTotal(labels["4p"]),
            avgTotal(labels.j),
          ]
        : [
            avgStage(labels["1p"], key),
            avgStage(labels["2p"], key),
            avgStage(labels["4p"], key),
            avgStage(labels.j, key),
          ];
    const isPrimary = key === "tesseract_recognize_ms" ? "YES (candidate)" : "";
    console.log(
      `| ${name} | ${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${isPrimary} |`
    );
  }

  console.log("\n--- Concurrency summary (4-page OCR wall) ---");
  for (const c of [1, 2, 3, 4]) {
    if (concResults[c]?.length) {
      console.log(`  c=${c}: ${fmtStats(stats(concResults[c]))}`);
    }
  }

  console.log("\n--- Bottleneck hints ---");
  console.log(`1-page OCR avg: ${avgOcr(labels["1p"])}`);
  console.log(`4-page raster avg: ${avgRaster(labels["4p"])}`);
  console.log(`4-page OCR avg: ${avgOcr(labels["4p"])}`);
  console.log(`JBIG2 raster avg: ${avgRaster(labels.j)}`);

  try {
    fs.rmSync(rasterDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  console.log("\nDone. Phase 2 NOT declared complete. No commit/push.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
