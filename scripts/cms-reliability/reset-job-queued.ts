import { PipelineStage } from "../../lib/content-pipeline/pipeline-stage";
import {
  readJobMetadata,
  updateJobMetadata,
  readPipelineState,
  updatePipelineState,
} from "../../lib/content-pipeline/job-manager";

const jobId = process.argv[2] ?? "job_1fa9b48dab6e4e37b06ed1c1060a7c36";

async function main() {
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
  console.log(JSON.stringify({ reset: true, jobId }));
}

void main();
