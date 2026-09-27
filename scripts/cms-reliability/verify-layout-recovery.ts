import { updateJobStatus } from "../../lib/content-pipeline/import-queue";
import { runLayoutForJob } from "../../lib/content-pipeline/layout-service";
import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import { readJobMetadata } from "../../lib/content-pipeline/job-manager";
import fs from "fs";
import path from "path";

const jobId = "job_1fa9b48dab6e4e37b06ed1c1060a7c36";

async function main() {
  // Simulate sticky crash marker then recover
  await updateJobStatus(jobId, "processing", {
    stage: PipelineStage.LAYOUT_PROCESSING,
    error: null,
  });
  console.log("SET sticky LAYOUT_PROCESSING");

  const metaBefore = await readJobMetadata(jobId);
  console.log("before", metaBefore?.stage, metaBefore?.status);

  const result = await runLayoutForJob(jobId);
  const structuredPath = path.join(
    process.cwd(),
    ".cms",
    "uploads",
    jobId,
    "structured-document.json"
  );

  console.log(
    JSON.stringify(
      {
        stage: result.job.stage,
        pageCount: result.summary.pageCount,
        sectionCount: result.summary.sectionCount,
        durationMs: result.summary.durationMs,
        structuredExists: fs.existsSync(structuredPath),
      },
      null,
      2
    )
  );
}

void main();
