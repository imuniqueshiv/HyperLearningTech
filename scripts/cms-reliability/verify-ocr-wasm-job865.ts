/**
 * Re-run OCR on the JBIG2 blank-raster job to verify wasmUrl fix.
 */
import fs from "fs";
import path from "path";

import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import { runOcrForJob } from "../../lib/content-pipeline/ocr-service";
import {
  readJobMetadata,
  updateJobMetadata,
  readPipelineState,
  updatePipelineState,
} from "../../lib/content-pipeline/job-manager";

const logPath = path.join(process.cwd(), "..", ".cursor", "debug-26e666.log");

function log(message: string, data: Record<string, unknown>) {
  const line = JSON.stringify({
    sessionId: "26e666",
    runId: "post-fix",
    hypothesisId: "H-C",
    location: "verify-ocr-wasm-job865.ts",
    message,
    data,
    timestamp: Date.now(),
  });
  fs.appendFileSync(logPath, line + "\n");
  console.log(line);
}

async function main() {
  const jobId = "job_865e79db822140b0b401b0fa44534bd7";
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new Error(`Job not found: ${jobId}`);
  }

  await updateJobMetadata({
    ...metadata,
    status: "queued",
    stage: PipelineStage.QUEUED,
    error: null,
    updatedAt: new Date().toISOString(),
  });

  const pipeline = await readPipelineState(jobId);
  if (pipeline) {
    await updatePipelineState({
      ...pipeline,
      status: "queued",
      stage: PipelineStage.QUEUED,
      error: null,
      updatedAt: new Date().toISOString(),
    });
  }

  log("OCR re-run start", { jobId });
  const result = await runOcrForJob(jobId);
  log("OCR re-run done", {
    jobId,
    textBlockCount: result.summary.textBlockCount,
    pageCount: result.summary.pageCount,
    imageCount: result.summary.imageCount,
    pageTextLens: result.rawDocument.pages.map((p) => (p.text || "").length),
    sample: result.rawDocument.pages[0]?.text?.slice(0, 220) ?? null,
  });
}

void main();
