import fs from "node:fs";
import path from "node:path";
import { createWorker } from "tesseract.js";
import {
  processPaperCandidate,
  REPO_ROOT,
  resolveDestPath,
  type BatchPaperCandidate,
  type ProcessResult,
} from "./local-cse-batch-processor.js";

/** Local gitignored scratch under the repo — no hosted AI paths. */
const SCRATCH_DIR = path.join(REPO_ROOT, ".cms", "cse-local-audit");

function paperKey(year: number, month: string): string {
  return `${String(month || "")
    .trim()
    .toLowerCase()}|${year}`;
}

function loadExistingKeys(destPath: string): Set<string> {
  const abs = resolveDestPath(destPath);
  const keys = new Set<string>();
  if (!fs.existsSync(abs)) return keys;
  try {
    const data = JSON.parse(fs.readFileSync(abs, "utf8")) as {
      papers?: Array<{ year?: number; month?: string; exam?: string }>;
    };
    for (const paper of data.papers || []) {
      if (typeof paper.year === "number" && paper.month) {
        keys.add(paperKey(paper.year, paper.month));
      }
      if (typeof paper.exam === "string") {
        keys.add(paper.exam.trim().toLowerCase());
      }
    }
  } catch {
    // treat as empty; processor will fail closed on corrupt JSON
  }
  return keys;
}

async function main() {
  const args = process.argv.slice(2);
  const semArg = args.find((a) => a.startsWith("--sem="))?.split("=")[1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number(limitArg) : undefined;

  const manifestPath = path.join(SCRATCH_DIR, "cse_ingestion_manifest.json");
  const downloadsDir = path.join(SCRATCH_DIR, "downloads");
  fs.mkdirSync(downloadsDir, { recursive: true });

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  console.log(`REPO_ROOT=${REPO_ROOT}`);

  const allManifest: BatchPaperCandidate[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );

  let targetCandidates = allManifest.filter((m) => {
    if (!(m as { isDistinctNew?: boolean }).isDistinctNew) return false;
    if (semArg && m.semester !== semArg) return false;
    const existing = loadExistingKeys(m.destPath);
    const key = paperKey(m.year, m.month);
    const exam = `${m.month} ${m.year}`.trim().toLowerCase();
    if (existing.has(key) || existing.has(exam)) {
      return false;
    }
    return true;
  });

  if (limit && Number.isFinite(limit) && limit > 0) {
    targetCandidates = targetCandidates.slice(0, limit);
  }

  console.log(`=== LOCAL CSE EXTRACTION BATCH ===`);
  console.log(`Target Semester filter: ${semArg || "ALL"}`);
  console.log(`Total candidates to process: ${targetCandidates.length}`);

  console.log("Initializing shared local Tesseract.js worker...");
  const t0 = Date.now();
  const worker = await createWorker("eng");
  console.log(`Tesseract worker initialized in ${Date.now() - t0}ms.`);

  const results: ProcessResult[] = [];
  let addedCount = 0;
  let skippedCount = 0;
  let reviewCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < targetCandidates.length; i++) {
      const cand = targetCandidates[i];
      console.log(
        `\n[${i + 1}/${targetCandidates.length}] Processing [${cand.semester}/${cand.subjectCode}] ${cand.year} ${cand.month}...`
      );
      console.log(`  Source URL: ${cand.pdfUrl}`);
      console.log(`  Dest: ${resolveDestPath(cand.destPath)}`);

      const res = await processPaperCandidate(cand, downloadsDir, worker);
      results.push(res);

      if (res.status === "ADDED") {
        addedCount++;
        console.log(
          `  -> SUCCESS: Added ${res.questionCount} questions (${res.subQuestionCount} subquestions)`
        );
      } else if (res.status === "SKIPPED_DUPLICATE") {
        skippedCount++;
        console.log(`  -> SKIPPED: ${res.reason}`);
      } else if (res.status === "REVIEW_REQUIRED") {
        reviewCount++;
        console.warn(`  -> REVIEW REQUIRED: ${res.reason}`);
      } else {
        failedCount++;
        console.error(`  -> FAILED: ${res.reason}`);
      }
    }
  } finally {
    await worker.terminate();
    console.log("\nTerminated Tesseract worker.");
  }

  const reportPath = path.join(
    SCRATCH_DIR,
    `batch_results_${semArg || "all"}_${Date.now()}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n=== BATCH SUMMARY (${semArg || "ALL"}) ===`);
  console.log(`Total Candidates: ${targetCandidates.length}`);
  console.log(`Added: ${addedCount}`);
  console.log(`Skipped (Duplicates): ${skippedCount}`);
  console.log(`Review Required: ${reviewCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Detailed report saved to: ${reportPath}`);
}

main().catch((err) => {
  console.error("Fatal batch execution error:", err);
  process.exit(1);
});
