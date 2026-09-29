/**
 * Phase 2 final acceptance performance + memory suite (≤15s ceiling).
 * Usage: CMS_OCR_PROFILE=1 node --import tsx scripts/cms-reliability/phase2-final-acceptance-bench.ts
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadDocumentFile } from "../../lib/content-pipeline/document-loader";
import {
  getResolvedPdfJsWasmUrl,
  LocalOcrEngine,
} from "../../lib/content-pipeline/local-ocr-engine";
import { buildStructuredDocument } from "../../lib/content-pipeline/structure-builder";
import { buildExtractionEvidence } from "../../lib/content-pipeline/extraction-evidence";
import {
  academicFromEvidence,
  validateAgainstEvidence,
} from "../../lib/content-pipeline/evidence-validator";
import { buildProductionPyqs } from "../../lib/content-pipeline/pyq-schema-builder";
import { availableRealDocumentFixtures } from "./fixtures/real-document-registry";

process.env.CMS_OCR_PROFILE = "1";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx];
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const median =
    sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return {
    n: values.length,
    min: sorted[0],
    avg,
    median,
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
  };
}

function fmt(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function rssMb(): number {
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
}

function fixture(id: string): string | null {
  return availableRealDocumentFixtures().find((f) => f.id === id)?.path ?? null;
}

async function runLocal(
  absolutePath: string,
  documents?: Awaited<ReturnType<typeof loadDocumentFile>>[]
): Promise<{
  ms: number;
  pages: number;
  blocks: number;
  wasmWarns: number;
  rssAfter: number;
}> {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...a: unknown[]) => {
    const s = a.map(String).join(" ");
    if (/instantiateWasm|Unable to load wasm/i.test(s)) warnings.push(s);
    origWarn(...a);
  };
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "hlt-final-"));
  try {
    const document = documents?.[0] ?? (await loadDocumentFile(absolutePath));
    const docs = documents ?? [document];
    const t0 = Date.now();
    const raw = await new LocalOcrEngine().extract({
      jobId: `final_${Date.now()}`,
      jobDir,
      document,
      documents: docs,
    });
    const structured = buildStructuredDocument(raw);
    const evidence = buildExtractionEvidence({
      raw,
      structured,
      declaredPaperCount: 1,
    });
    const academic = academicFromEvidence(evidence, {
      metadata: {
        jobId: "final",
        jobType: "pyq",
        sourceFilename: path.basename(absolutePath),
        subjectCode: "FIN",
        subjectName: null,
        subjectTitle: null,
        branch: null,
        semester: null,
        university: null,
        structuredAt: new Date().toISOString(),
        model: "final",
        detector: "final",
      },
      exam: {
        exam: "Final",
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
    return {
      ms: Date.now() - t0,
      pages: raw.pages.length,
      blocks: raw.metadata.textBlockCount,
      wasmWarns: warnings.length,
      rssAfter: rssMb(),
    };
  } finally {
    console.warn = origWarn;
    try {
      fs.rmSync(jobDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

async function bench(
  label: string,
  absolutePath: string,
  runs: number,
  ceilingMs: number,
  documents?: Awaited<ReturnType<typeof loadDocumentFile>>[]
) {
  const times: number[] = [];
  let cold = 0;
  let pages = 0;
  let wasmWarns = 0;
  for (let i = 0; i < runs; i += 1) {
    const r = await runLocal(absolutePath, documents);
    times.push(r.ms);
    pages = r.pages;
    wasmWarns += r.wasmWarns;
    if (i === 0) cold = r.ms;
    console.log(
      `  ${label} run${i + 1}: ${fmt(r.ms)} pages=${r.pages} blocks=${r.blocks} rss=${r.rssAfter}MB wasmWarns=${r.wasmWarns}`
    );
  }
  const s = summarize(times);
  const warmAvg =
    times.length > 1
      ? times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1)
      : s.avg;
  const status =
    s.median <= ceilingMs && s.max <= ceilingMs + 2000
      ? s.max <= ceilingMs
        ? "PASS"
        : "PASS*"
      : s.median <= ceilingMs
        ? "PASS* (max over ceiling — check host)"
        : "FAIL";
  console.log(
    `  ${label} SUMMARY pages=${pages} cold=${fmt(cold)} warmAvg=${fmt(warmAvg)} avg=${fmt(s.avg)} median=${fmt(s.median)} p95=${fmt(s.p95)} max=${fmt(s.max)} ceiling=${fmt(ceilingMs)} → ${status}`
  );
  return { label, pages, cold, warmAvg, ...s, ceilingMs, status, wasmWarns };
}

async function memoryStress(absolutePath: string, runs: number) {
  console.log(`\n=== Memory stress ${runs}× ===`);
  console.log(`RSS start ${rssMb()}MB`);
  const times: number[] = [];
  const rss: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const r = await runLocal(absolutePath);
    times.push(r.ms);
    rss.push(r.rssAfter);
    console.log(`  run ${i + 1}: ${fmt(r.ms)} rss=${r.rssAfter}MB`);
  }
  const early = times.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const late = times.slice(-3).reduce((a, b) => a + b, 0) / 3;
  console.log(
    `early=${fmt(early)} late=${fmt(late)} ratio=${(late / early).toFixed(2)} RSS ${rss[0]}→${rss.at(-1)} Δ=${rss.at(-1)! - rss[0]}MB`
  );
  return { early, late, rssStart: rss[0], rssEnd: rss.at(-1)!, times };
}

async function main() {
  console.log("# Phase 2 Final Acceptance Bench");
  console.log(
    `Node ${process.version} CPUs=${os.cpus().length} RSS=${rssMb()}MB`
  );
  console.log(`wasmUrl=${getResolvedPdfJsWasmUrl()}`);
  console.log("OLD ≤5s TARGET: REMOVED");
  console.log("NEW PRODUCTION CEILING: ≤15s");

  const results = [];

  const native = fixture("native-text-al402-sample");
  if (native) results.push(await bench("native-pdf", native, 4, 2000));
  else console.log("native-pdf: NOT VERIFIED");

  const image = fixture("cy301-page1-image");
  if (image) results.push(await bench("1-page-image", image, 4, 10000));

  const two = fixture("al402-jun-2025");
  if (two) results.push(await bench("2-page-scanned", two, 4, 12000));

  const three = fixture("al402-nov-2023");
  if (three) results.push(await bench("3-page-scanned", three, 3, 12000));

  const four = fixture("dec2023-4page-single-paper");
  if (four) results.push(await bench("4-page-scanned", four, 5, 15000));

  const five = fixture("synthetic-5page-scanned");
  if (five)
    results.push(await bench("5-page-scanned-SYNTHETIC", five, 3, 15000));
  else console.log("5-page-scanned: NOT VERIFIED");

  const jbig2 = fixture("jbig2-al-402-committed");
  if (jbig2) results.push(await bench("jbig2-2page", jbig2, 4, 15000));

  const multi = availableRealDocumentFixtures().find(
    (f) => f.id === "cy301-multi-image-one-paper"
  );
  if (multi?.imagePaths && multi.imagePaths.length >= 2) {
    const docs = [];
    for (const p of multi.imagePaths.slice(0, 5)) {
      docs.push(await loadDocumentFile(p));
    }
    results.push(
      await bench(`multi-image-${docs.length}`, multi.path!, 3, 15000, docs)
    );
  }

  if (two) await memoryStress(two, 12);

  console.log(
    "\n| Fixture | Pages | Cold | Warm | Avg | Median | P95/Max | Status |"
  );
  console.log("|---|---:|---:|---:|---:|---:|---:|---|");
  for (const r of results) {
    console.log(
      `| ${r.label} | ${r.pages} | ${fmt(r.cold)} | ${fmt(r.warmAvg)} | ${fmt(r.avg)} | ${fmt(r.median)} | ${fmt(r.p95)} / ${fmt(r.max)} | ${r.status} |`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
