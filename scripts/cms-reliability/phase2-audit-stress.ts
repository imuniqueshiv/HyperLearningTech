/**
 * Independent Phase 2 production audit: performance + memory stress.
 *
 * Usage:
 *   node --import tsx scripts/cms-reliability/phase2-audit-stress.ts
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import v8 from "node:v8";

import { loadDocumentFile } from "../../lib/content-pipeline/document-loader";
import { LocalOcrEngine } from "../../lib/content-pipeline/local-ocr-engine";
import { buildStructuredDocument } from "../../lib/content-pipeline/structure-builder";
import { buildExtractionEvidence } from "../../lib/content-pipeline/extraction-evidence";
import {
  academicFromEvidence,
  validateAgainstEvidence,
} from "../../lib/content-pipeline/evidence-validator";
import { buildProductionPyqs } from "../../lib/content-pipeline/pyq-schema-builder";
import { availableRealDocumentFixtures } from "./fixtures/real-document-registry";

function rssMb(): number {
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
}

function heapMb(): number {
  return Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const variance =
    values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  return { min, avg, median, max, stdev };
}

async function pipelineOnce(
  label: string,
  absolutePath: string,
  documents?: Awaited<ReturnType<typeof loadDocumentFile>>[]
) {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "hlt-audit-"));
  const document = documents?.[0] ?? (await loadDocumentFile(absolutePath));
  const docs = documents ?? [document];
  const engine = new LocalOcrEngine();
  const t0 = Date.now();
  const raw = await engine.extract({
    jobId: `audit_${label}_${Date.now()}`,
    jobDir,
    document,
    documents: docs,
  });
  const tOcr = Date.now();
  const structured = buildStructuredDocument(raw);
  const evidence = buildExtractionEvidence({
    raw,
    structured,
    declaredPaperCount: 1,
  });
  const academic = academicFromEvidence(evidence, {
    metadata: {
      jobId: "audit",
      jobType: "pyq",
      sourceFilename: path.basename(absolutePath),
      subjectCode: "AUDIT",
      subjectName: null,
      subjectTitle: null,
      branch: null,
      semester: null,
      university: null,
      structuredAt: new Date().toISOString(),
      model: "audit",
      detector: "audit",
    },
  });
  validateAgainstEvidence(academic, evidence);
  const pyqs = buildProductionPyqs(academic);
  const totalMs = Date.now() - t0;
  return {
    totalMs,
    ocrMs: tOcr - t0,
    postMs: totalMs - (tOcr - t0),
    pages: raw.pages.length,
    blocks: raw.metadata.textBlockCount,
    questions: pyqs.papers[0]?.questions.length ?? 0,
    raster: raw.pages.some((p) => Boolean(p.imagePath)),
  };
}

async function benchFixture(
  label: string,
  absolutePath: string,
  runs: number,
  documents?: Awaited<ReturnType<typeof loadDocumentFile>>[]
) {
  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    const sample = await pipelineOnce(label, absolutePath, documents);
    samples.push(sample);
    console.log(
      `  run${i} total=${sample.totalMs}ms ocr=${sample.ocrMs}ms pages=${sample.pages} blocks=${sample.blocks} q=${sample.questions} raster=${sample.raster} rss=${rssMb()}MB`
    );
  }
  const totals = samples.map((s) => s.totalMs);
  const s = stats(totals);
  const primary = s.avg <= 5000 && s.max <= 8000;
  const fallback = s.avg <= 10000 && s.max <= 10000;
  console.log(
    `SUMMARY ${label} pages=${samples[0].pages} cold=${samples[0].totalMs} warmAvg=${Math.round(
      samples.slice(1).reduce((a, b) => a + b.totalMs, 0) /
        Math.max(1, samples.length - 1)
    )} min=${s.min} avg=${Math.round(s.avg)} median=${Math.round(s.median)} max=${s.max} stdev=${Math.round(
      s.stdev
    )} primary5s=${primary ? "MET" : "NOT_MET"} fallback10s=${fallback ? "MET" : "NOT_MET"}`
  );
  return { label, samples, stats: s };
}

async function memoryStress(absolutePath: string, iterations: number) {
  console.log(`\n=== MEMORY STRESS ${iterations} consecutive imports ===`);
  const series: Array<{ i: number; ms: number; rss: number; heap: number }> =
    [];
  for (let i = 0; i < iterations; i += 1) {
    if (global.gc) global.gc();
    const before = rssMb();
    const result = await pipelineOnce(`stress_${i}`, absolutePath);
    const after = rssMb();
    series.push({
      i,
      ms: result.totalMs,
      rss: after,
      heap: heapMb(),
    });
    console.log(
      `  stress#${i} ms=${result.totalMs} rssBefore=${before} rssAfter=${after} heap=${heapMb()} blocks=${result.blocks}`
    );
  }
  const firstRss = series[0].rss;
  const lastRss = series[series.length - 1].rss;
  const midRss = series[Math.floor(series.length / 2)].rss;
  const firstMs = series[0].ms;
  const lastMs = series[series.length - 1].ms;
  const growth = lastRss - firstRss;
  console.log(
    `STRESS_SUMMARY firstRss=${firstRss} midRss=${midRss} lastRss=${lastRss} growthMB=${growth} firstMs=${firstMs} lastMs=${lastMs} heapLimit=${Math.round(
      v8.getHeapStatistics().heap_size_limit / (1024 * 1024)
    )}MB`
  );
  // Soft leak signal: >150MB growth over 10 stable runs after warm-up, or >2x slowdown.
  const warm = series.slice(2);
  const warmFirst = warm[0]?.rss ?? firstRss;
  const warmLast = warm[warm.length - 1]?.rss ?? lastRss;
  const warmGrowth = warmLast - warmFirst;
  const slowdown = lastMs / Math.max(1, series[1]?.ms ?? firstMs);
  const leakSuspected = warmGrowth > 150 || slowdown > 2.5;
  console.log(
    `LEAK_SIGNAL warmGrowthMB=${warmGrowth} slowdown=${slowdown.toFixed(2)} suspected=${leakSuspected}`
  );
  return { series, leakSuspected, warmGrowth, slowdown };
}

async function main() {
  console.log("Phase 2 independent audit stress");
  console.log(`pid=${process.pid} startRss=${rssMb()}MB`);

  const fixtures = availableRealDocumentFixtures();
  const byId = (id: string) => fixtures.find((f) => f.id === id);

  const native = byId("native-text-al402-sample");
  const image = byId("cy301-page1-image");
  const jbig2 = byId("jbig2-al-402-committed");
  const two = byId("al402-jun-2025");
  const three = byId("al402-nov-2023");
  const four = byId("dec2023-4page-single-paper");
  const multi = byId("cy301-multi-image-one-paper");

  if (native?.path) await benchFixture("native-pdf", native.path, 5);
  else console.log("native-pdf: NOT VERIFIED");

  if (image?.path) await benchFixture("1-page-image", image.path, 5);
  else console.log("1-page-image: NOT VERIFIED");

  if (jbig2?.path) await benchFixture("jbig2-2page", jbig2.path, 5);
  else console.log("jbig2: NOT VERIFIED");

  if (two?.path) await benchFixture("scanned-2page", two.path, 4);
  else console.log("scanned-2page: NOT VERIFIED");

  if (three?.path) await benchFixture("scanned-3page", three.path, 3);
  else console.log("scanned-3page: NOT VERIFIED");

  if (four?.path) await benchFixture("scanned-4page", four.path, 3);
  else console.log("scanned-4page: NOT VERIFIED");

  const fivePath = path.join(
    process.cwd(),
    "scripts/cms-reliability/fixtures/synthetic-5page-native.pdf"
  );
  if (fs.existsSync(fivePath)) {
    await benchFixture("synthetic-5page", fivePath, 3);
  } else {
    console.log("5-page: NOT VERIFIED — REAL/SYNTHETIC FIXTURE MISSING");
  }

  if (multi?.path && multi.imagePaths && multi.imagePaths.length >= 2) {
    const docs = [];
    for (const p of multi.imagePaths.slice(0, 5)) {
      docs.push(await loadDocumentFile(p));
    }
    await benchFixture(`multi-image-${docs.length}`, multi.path, 3, docs);
  }

  if (jbig2?.path) {
    await memoryStress(jbig2.path, 10);
  }

  console.log("\nAUDIT_STRESS_DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
