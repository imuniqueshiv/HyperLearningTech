/**
 * Cooperative cancellation markers for Import Sessions.
 * Stage runners check isImportCancelled between work units where possible.
 */

import fs from "fs/promises";
import path from "path";

import { updateJobStatus } from "./import-queue";
import { readJobMetadata, readPipelineState } from "./job-manager";
import { PipelineStage } from "./pipeline-stage";
import { getJobDirectory } from "./temp-storage";

const CANCEL_FILENAME = "cancel.requested.json";

function cancelPath(jobId: string): string {
  return path.join(getJobDirectory(jobId), CANCEL_FILENAME);
}

export async function requestImportCancellation(jobId: string): Promise<{
  jobId: string;
  cancelled: boolean;
  message: string;
}> {
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new Error("JOB_NOT_FOUND");
  }

  const terminal = new Set(["completed", "cancelled", "approved", "rejected"]);
  if (terminal.has(metadata.status)) {
    return {
      jobId,
      cancelled: false,
      message: `Job is already finalized (${metadata.status}).`,
    };
  }

  await fs.writeFile(
    cancelPath(jobId),
    JSON.stringify(
      {
        requestedAt: new Date().toISOString(),
        reason: "admin_cancel",
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  await updateJobStatus(jobId, "cancelled", {
    error: "Cancelled by administrator.",
    stage: PipelineStage.CANCELLED,
  });

  return {
    jobId,
    cancelled: true,
    message:
      "Cancellation recorded. In-flight stage work stops cooperatively at the next checkpoint.",
  };
}

export async function isImportCancelled(jobId: string): Promise<boolean> {
  try {
    await fs.access(cancelPath(jobId));
    return true;
  } catch {
    const pipeline = await readPipelineState(jobId);
    return (
      pipeline?.status === "cancelled" ||
      pipeline?.stage === PipelineStage.CANCELLED
    );
  }
}

export async function clearImportCancellation(jobId: string): Promise<void> {
  try {
    await fs.unlink(cancelPath(jobId));
  } catch {
    // absent is fine
  }
}
