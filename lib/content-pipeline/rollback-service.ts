/**
 * Restores content JSON from job backup/ after a failed Local Save.
 */

import fs from "fs/promises";
import path from "path";

import { fileExists } from "./json-reader";
import { getJobDirectory } from "./temp-storage";
import { getSubjectContentDir } from "./writer-service";
import { readJobMetadata } from "./job-manager";
import { handleStageFailure } from "./failure-handler";
import { PipelineStage } from "./pipeline-stage";

export class RollbackProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RollbackProcessingError";
    this.code = code;
  }
}

/**
 * Restores pyqs.json / syllabus.json from `.cms/uploads/<jobId>/backup/`.
 * Does not touch diagrams already copied (identical/skip policy).
 */
export async function rollbackLocalSave(jobId: string): Promise<{
  restoredFiles: string[];
  message: string;
}> {
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new RollbackProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  if (!metadata.branch || !metadata.semester || !metadata.subjectCode) {
    throw new RollbackProcessingError(
      "CONTENT_TARGET_REQUIRED",
      "Rollback requires branch, semester, and subjectCode."
    );
  }

  const backupDir = path.join(getJobDirectory(jobId), "backup");
  const contentDir = getSubjectContentDir({
    branch: metadata.branch,
    semester: metadata.semester,
    subjectCode: metadata.subjectCode,
  });

  const restoredFiles: string[] = [];
  const candidates = ["pyqs.json", "syllabus.json"];

  for (const name of candidates) {
    const backupPath = path.join(backupDir, name);
    const targetPath = path.join(contentDir, name);

    if (!(await fileExists(backupPath))) {
      continue;
    }

    await fs.mkdir(contentDir, { recursive: true });
    await fs.copyFile(backupPath, targetPath);
    restoredFiles.push(toRepoRelative(targetPath));
  }

  if (restoredFiles.length === 0) {
    await handleStageFailure({
      jobId,
      stage: PipelineStage.LOCAL_SAVED,
      reason: "Rollback requested but no backup files were found.",
      outcome: "Skipped",
    });

    return {
      restoredFiles: [],
      message: "No backup files found to restore.",
    };
  }

  return {
    restoredFiles,
    message: `Restored ${restoredFiles.length} file(s) from backup.`,
  };
}

function toRepoRelative(absolutePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = absolutePath.replace(/\\/g, "/");
  if (normalized.startsWith(cwd + "/")) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}
