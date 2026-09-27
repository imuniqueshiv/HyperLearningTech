/**
 * Reset failed scanned-PDF job and run OCR via the same service entry Next uses.
 * Exercises loadNativeCanvas() / createRequire path used by rasterizePdfPage.
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

const logPath = path.join(process.cwd(), "debug-26e666.log");

function log(location: string, message: string, data: Record<string, unknown>) {
  const line = JSON.stringify({
    sessionId: "26e666",
    runId: "post-fix",
    hypothesisId: "H-turbopack",
    location,
    message,
    data,
    timestamp: Date.now(),
  });
  fs.appendFileSync(logPath, line + "\n");
  console.log(line);
}

async function main() {
  const jobId = "job_1fa9b48dab6e4e37b06ed1c1060a7c36";

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

  log("verify-ocr:start", "Re-running OCR on previously failed scanned PDF", {
    jobId,
    previousError: metadata.error,
  });

  try {
    const result = await runOcrForJob(jobId);
    log("verify-ocr:done", "OCR succeeded", {
      jobId,
      stage: result.job.stage,
      textBlockCount: result.summary.textBlockCount,
      pageCount: result.summary.pageCount,
      imageCount: result.summary.imageCount,
      engine: result.summary.engine,
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          textBlockCount: result.summary.textBlockCount,
          sample: result.rawDocument.pages[0]?.text?.slice(0, 180),
        },
        null,
        2
      )
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log("verify-ocr:error", "OCR failed", {
      jobId,
      message: err.message,
      stack: err.stack,
      cause:
        err.cause instanceof Error
          ? { message: err.cause.message, stack: err.cause.stack }
          : (err.cause ?? null),
    });
    throw err;
  }
}

void main();
