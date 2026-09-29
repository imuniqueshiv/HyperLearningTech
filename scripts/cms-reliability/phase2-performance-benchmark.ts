/**
 * Phase 2 production performance benchmark.
 *
 * Measures local OCR→schema only. Gemini/network is NEVER included in the SLA.
 *
 * Usage:
 *   node --import tsx scripts/cms-reliability/phase2-performance-benchmark.ts
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

interface StageTimings {
  loadMs: number;
  ocrMs: number;
  structureMs: number;
  evidenceMs: number;
  validationMs: number;
  schemaMs: number;
  postOcrMs: number;
  totalMs: number;
  pages: number;
  questions: number;
  textBlocks: number;
  usedRaster: boolean;
}

function stats(values: number[]): { min: number; avg: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, avg, max };
}

function fmt(s: { min: number; avg: number; max: number }): string {
  return `min=${(s.min / 1000).toFixed(2)}s avg=${(s.avg / 1000).toFixed(2)}s max=${(s.max / 1000).toFixed(2)}s`;
}

async function runOnce(
  label: string,
  absolutePath: string,
  runs: number,
  documents?: Awaited<ReturnType<typeof loadDocumentFile>>[]
): Promise<StageTimings[]> {
  const samples: StageTimings[] = [];
  for (let i = 0; i < runs; i += 1) {
    const jobId = `bench_${label}_${i}`;
    const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), `hlt-bench-`));

    const tLoad0 = Date.now();
    const document = documents?.[0] ?? (await loadDocumentFile(absolutePath));
    const docs = documents ?? [document];
    const loadMs = Date.now() - tLoad0;

    const engine = new LocalOcrEngine();
    const t0 = Date.now();
    const raw = await engine.extract({
      jobId,
      jobDir,
      document,
      documents: docs,
    });
    const t1 = Date.now();

    const structured = buildStructuredDocument(raw);
    const t2 = Date.now();

    const evidence = buildExtractionEvidence({
      raw,
      structured,
      declaredPaperCount: 1,
    });
    const academic = academicFromEvidence(evidence, {
      metadata: {
        jobId,
        jobType: "pyq",
        sourceFilename: path.basename(absolutePath),
        subjectCode: "BENCH",
        subjectName: null,
        subjectTitle: null,
        branch: null,
        semester: null,
        university: null,
        structuredAt: new Date().toISOString(),
        model: "bench",
        detector: "bench",
      },
      exam: {
        exam: "Bench",
        year: 2025,
        month: "June",
        maxMarks: 70,
        time: "3 Hours",
        commonInstructions: [],
        isPredicted: null,
        gradingSystem: null,
      },
    });
    const t3 = Date.now();

    validateAgainstEvidence(academic, evidence);
    const t4 = Date.now();

    const pyqs = buildProductionPyqs(academic);
    const t5 = Date.now();

    samples.push({
      loadMs,
      ocrMs: t1 - t0,
      structureMs: t2 - t1,
      evidenceMs: t3 - t2,
      validationMs: t4 - t3,
      schemaMs: t5 - t4,
      postOcrMs: t5 - t1,
      totalMs: t5 - t0,
      pages: raw.pages.length,
      questions: pyqs.papers[0]?.questions.length ?? 0,
      textBlocks: raw.metadata.textBlockCount,
      usedRaster: raw.pages.some((p) => Boolean(p.imagePath)),
    });
  }

  const total = stats(samples.map((s) => s.totalMs));
  const ocr = stats(samples.map((s) => s.ocrMs));
  const post = stats(samples.map((s) => s.postOcrMs));
  const load = stats(samples.map((s) => s.loadMs));

  console.log(`\n=== ${label} (${samples[0].pages} pages, ${runs} runs) ===`);
  console.log(`Input load     ${fmt(load)}`);
  console.log(`OCR engine     ${fmt(ocr)}`);
  console.log(
    `Post-OCR       ${fmt(post)} (structure+evidence+validation+schema)`
  );
  console.log(`TOTAL local    ${fmt(total)}`);
  console.log(
    `Questions=${samples.at(-1)?.questions} blocks=${samples.at(-1)?.textBlocks} raster=${samples.at(-1)?.usedRaster}`
  );
  console.log(`Gemini: NOT INCLUDED (measure separately)`);

  const primary = total.avg <= 5000;
  const fallback = total.avg <= 10000 && total.max <= 10000;
  if (primary) {
    console.log(`PRIMARY ≤5s: MET (avg ${(total.avg / 1000).toFixed(2)}s)`);
  } else if (fallback) {
    console.log(
      `PRIMARY ≤5s: NOT MET | FALLBACK ≤10s: MET (avg ${(total.avg / 1000).toFixed(2)}s max ${(total.max / 1000).toFixed(2)}s)`
    );
  } else {
    console.log(
      `PRIMARY ≤5s: NOT MET | FALLBACK ≤10s: NOT MET (avg ${(total.avg / 1000).toFixed(2)}s max ${(total.max / 1000).toFixed(2)}s)`
    );
  }

  return samples;
}

async function main() {
  const fixtures = availableRealDocumentFixtures();
  console.log("Phase 2 performance benchmark (local OCR→schema only)");
  console.log(`Available: ${fixtures.map((f) => f.id).join(", ")}`);

  const native = fixtures.find((f) => f.id === "native-text-al402-sample");
  const oneImage = fixtures.find((f) => f.id === "cy301-page1-image");
  const twoPage = fixtures.find((f) => f.id === "al402-jun-2025");
  const jbig2 = fixtures.find((f) => f.id === "jbig2-al-402-committed");
  const multiImage = fixtures.find(
    (f) => f.id === "cy301-multi-image-one-paper"
  );
  const threePage = fixtures.find((f) => f.id === "al402-nov-2023");
  const fourPage = fixtures.find((f) => f.id === "dec2023-4page-single-paper");

  if (native?.path) {
    await runOnce("1-page-native-pdf", native.path, 4);
  } else {
    console.log("\n1-page-native-pdf: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (oneImage?.path) {
    await runOnce("1-page-image", oneImage.path, 4);
  } else {
    console.log("\n1-page-image: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (twoPage?.path) {
    await runOnce("2-page-scanned-pdf", twoPage.path, 4);
  } else {
    console.log("\n2-page-scanned-pdf: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (jbig2?.path) {
    await runOnce("jbig2-2-page", jbig2.path, 4);
  } else {
    console.log("\njbig2-2-page: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (threePage?.path) {
    await runOnce("3-page-scanned-pdf", threePage.path, 3);
  } else {
    console.log("\n3-page-scanned-pdf: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (
    multiImage?.path &&
    multiImage.imagePaths &&
    multiImage.imagePaths.length >= 2
  ) {
    const docs = [];
    for (const p of multiImage.imagePaths.slice(0, 5)) {
      docs.push(await loadDocumentFile(p));
    }
    await runOnce(`multi-image-${docs.length}`, multiImage.path, 3, docs);
  } else {
    console.log("\n2–5 image paper: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  if (fourPage?.path) {
    await runOnce("4-page-scanned-pdf", fourPage.path, 3);
  } else {
    console.log("\n4-page-scanned-pdf: NOT VERIFIED — REAL FIXTURE MISSING");
  }

  console.log("\n5-page-scanned-pdf: NOT VERIFIED — REAL FIXTURE MISSING");
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
