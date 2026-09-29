/**
 * Live Gemini E2E for Phase 2 (real document → OCR → evidence → Gemini → validate → schema).
 *
 * Usage:
 *   node --import tsx scripts/cms-reliability/phase2-gemini-live-e2e.ts
 *
 * Loads .env.local for GEMINI_KEY_*.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { config as loadDotenv } from "dotenv";

loadDotenv({ path: path.join(process.cwd(), ".env.local") });
loadDotenv({ path: path.join(process.cwd(), ".env") });

async function main() {
  const { loadDocumentFile } =
    await import("../../lib/content-pipeline/document-loader");
  const { LocalOcrEngine } =
    await import("../../lib/content-pipeline/local-ocr-engine");
  const { buildStructuredDocument } =
    await import("../../lib/content-pipeline/structure-builder");
  const { buildExtractionEvidence } =
    await import("../../lib/content-pipeline/extraction-evidence");
  const { GeminiStructuringEngine } =
    await import("../../lib/content-pipeline/gemini-structuring");
  const { ensurePapersOnAcademicDocument, validateAgainstEvidence } =
    await import("../../lib/content-pipeline/evidence-validator");
  const { buildProductionPyqs } =
    await import("../../lib/content-pipeline/pyq-schema-builder");
  const { getGeminiKeys } = await import("../../lib/ai/key-manager");
  const { availableRealDocumentFixtures } =
    await import("./fixtures/real-document-registry");

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    console.error("FAIL: No GEMINI_KEY_* configured after loading .env.local");
    process.exit(1);
  }
  console.log(`Gemini keys loaded: ${keys.length}`);

  const fixture =
    availableRealDocumentFixtures().find((f) => f.id === "cy301-page1-image") ??
    availableRealDocumentFixtures().find(
      (f) => f.id === "jbig2-al-402-committed"
    );

  if (!fixture?.path) {
    console.error("FAIL: No real fixture available for Gemini E2E");
    process.exit(1);
  }

  const jobId = `gemini_live_${Date.now()}`;
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), "hlt-gemini-"));
  const document = await loadDocumentFile(fixture.path);
  const engine = new LocalOcrEngine();

  console.log(`Document: ${fixture.id} (${fixture.path})`);

  const t0 = Date.now();
  const raw = await engine.extract({
    jobId,
    jobDir,
    document,
    documents: [document],
  });
  const tOcr = Date.now();
  console.log(
    `OCR: ${(tOcr - t0) / 1000}s pages=${raw.pages.length} blocks=${raw.metadata.textBlockCount}`
  );

  const structured = buildStructuredDocument(raw);
  const evidence = buildExtractionEvidence({
    raw,
    structured,
    declaredPaperCount: 1,
  });
  console.log(
    `Evidence: questions=${evidence.questionCandidates.length} warnings=${evidence.warnings.length}`
  );

  const gemini = new GeminiStructuringEngine();
  const tG0 = Date.now();
  let academic;
  try {
    const result = await gemini.structure({
      jobId,
      jobType: "pyq",
      branch: "CSE",
      semester: "3",
      subjectCode: fixture.subjectHint ?? "CY-301",
      sourceFilename: path.basename(fixture.path),
      document: structured,
      evidence,
    });
    academic = result.academicDocument;
    console.log(
      `Gemini: OK model=${result.model} networkMs=${Date.now() - tG0}`
    );
  } catch (err) {
    console.error("Gemini: FAIL", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  academic = ensurePapersOnAcademicDocument(academic, evidence);
  const validation = validateAgainstEvidence(academic, evidence);
  console.log(
    `Validation: status=${validation.status} errors=${validation.errors.length} warnings=${validation.warnings.length}`
  );
  if (validation.status === "INVALID") {
    console.error("FAIL: evidence validation INVALID", validation.errors);
    process.exit(1);
  }

  const pyqs = buildProductionPyqs(academic);
  const paper = pyqs.papers[0];
  console.log(
    JSON.stringify(
      {
        papers: pyqs.papers.length,
        academicPaperId: academic.papers?.[0]?.paperId ?? null,
        questions: paper?.questions.length ?? 0,
        questionNumbers: (paper?.questions ?? []).map((q) => q.questionNumber),
        localPipelineMs: tOcr - t0,
        geminiNetworkMs: Date.now() - tG0,
        totalWallMs: Date.now() - t0,
      },
      null,
      2
    )
  );

  if (pyqs.papers.length !== 1) {
    console.error("FAIL: expected papers.length === 1");
    process.exit(1);
  }
  if ((academic.papers?.[0]?.paperId ?? "") !== "paper-1") {
    console.warn(`WARN: academic paper id is ${academic.papers?.[0]?.paperId}`);
  }

  // Failure mode: empty AI questions against non-empty evidence must not be VALID.
  const solePaper = academic.papers?.[0];
  if (!solePaper) {
    console.error("FAIL: expected academic.papers[0]");
    process.exit(1);
  }
  const badAcademic = {
    ...academic,
    papers: [
      {
        ...solePaper,
        questions: [],
      },
    ],
  };
  const badCheck = validateAgainstEvidence(
    badAcademic as typeof academic,
    evidence
  );
  console.log(
    `Failure-mode empty questions vs evidence: status=${badCheck.status} (expect INVALID or REVIEW_REQUIRED)`
  );
  if (badCheck.status === "VALID") {
    console.error("FAIL: empty AI questions should not validate as VALID");
    process.exit(1);
  }

  console.log("GEMINI_LIVE_E2E: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
