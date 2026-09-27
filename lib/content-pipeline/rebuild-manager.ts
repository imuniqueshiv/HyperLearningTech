/**
 * Rebuild preconditions and stage preparation (no OCR/layout/diagrams).
 */

import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";

import {
  CMS_PRODUCTION_PYQS_FILENAME,
  CMS_PRODUCTION_SYLLABUS_FILENAME,
} from "./constants";
import { fileExists } from "./json-reader";
import { updateJobStatus } from "./import-queue";
import { readJobMetadata } from "./job-manager";
import { readStructuredDocument } from "./layout-service";
import { PipelineStage } from "./pipeline-stage";
import type { RebuildMode } from "./rebuild-types";
import { getJobDirectory } from "./temp-storage";
import { readAcademicDocument } from "./structuring-service";
import { readRawDocument } from "./ocr-service";

export class RebuildManagerError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RebuildManagerError";
    this.code = code;
  }
}

/**
 * Ensures OCR / layout / diagram artifacts exist (reused, never re-run).
 */
export async function assertRebuildArtifacts(jobId: string): Promise<void> {
  const metadata = await readJobMetadata(jobId);
  if (!metadata) {
    throw new RebuildManagerError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
  }

  const raw = await readRawDocument(jobId);
  if (!raw) {
    throw new RebuildManagerError(
      "OCR_REQUIRED",
      "raw-document.json missing. Run OCR before rebuild."
    );
  }

  const structured = await readStructuredDocument(jobId);
  if (!structured) {
    throw new RebuildManagerError(
      "LAYOUT_REQUIRED",
      "structured-document.json missing. Run layout before rebuild."
    );
  }

  const diagramsDir = path.join(getJobDirectory(jobId), "diagrams");
  // Diagrams folder may be empty for text-only papers; existence of layout is enough.
  try {
    await fs.access(diagramsDir);
  } catch {
    // optional — layout may have produced no diagram assets
  }
}

/**
 * Mode-specific artifact checks beyond OCR/layout.
 */
export async function assertModeArtifacts(
  jobId: string,
  mode: RebuildMode
): Promise<void> {
  if (mode === "full" || mode === "structuring") {
    return;
  }

  if (mode === "schema" || mode === "validation" || mode === "writer") {
    const academic = await readAcademicDocument(jobId);
    if (!academic && mode === "schema") {
      throw new RebuildManagerError(
        "ACADEMIC_REQUIRED",
        "academic-document.json missing. Rebuild Gemini first."
      );
    }
  }

  if (mode === "validation" || mode === "writer") {
    const jobDir = getJobDirectory(jobId);
    const hasPyqs = await fileExists(
      path.join(jobDir, CMS_PRODUCTION_PYQS_FILENAME)
    );
    const hasSyllabus = await fileExists(
      path.join(jobDir, CMS_PRODUCTION_SYLLABUS_FILENAME)
    );
    if (!hasPyqs && !hasSyllabus) {
      throw new RebuildManagerError(
        "SCHEMA_REQUIRED",
        "production JSON missing. Rebuild Schema Builder first."
      );
    }
  }
}

/**
 * Temporarily sets pipeline stage so existing runners accept the job
 * without redesigning their stage gates.
 */
export async function prepareRunnerStage(
  jobId: string,
  stage: PipelineStage
): Promise<void> {
  await updateJobStatus(jobId, "processing", {
    stage,
    error: null,
  });
}

export function stagesForMode(mode: RebuildMode): {
  runStructuring: boolean;
  runSchema: boolean;
  runValidation: boolean;
  runWriter: boolean;
  skipped: string[];
} {
  switch (mode) {
    case "structuring":
      return {
        runStructuring: true,
        runSchema: false,
        runValidation: false,
        runWriter: false,
        skipped: [
          "schema",
          "validation",
          "writer",
          "ocr",
          "layout",
          "diagrams",
        ],
      };
    case "schema":
      return {
        runStructuring: false,
        runSchema: true,
        runValidation: false,
        runWriter: false,
        skipped: [
          "structuring",
          "validation",
          "writer",
          "ocr",
          "layout",
          "diagrams",
        ],
      };
    case "validation":
      return {
        runStructuring: false,
        runSchema: false,
        runValidation: true,
        runWriter: false,
        skipped: [
          "structuring",
          "schema",
          "writer",
          "ocr",
          "layout",
          "diagrams",
        ],
      };
    case "writer":
      return {
        runStructuring: false,
        runSchema: false,
        runValidation: false,
        runWriter: true,
        skipped: [
          "structuring",
          "schema",
          "validation",
          "ocr",
          "layout",
          "diagrams",
        ],
      };
    case "full":
    default:
      return {
        runStructuring: true,
        runSchema: true,
        runValidation: true,
        runWriter: true,
        skipped: ["ocr", "layout", "diagrams"],
      };
  }
}

/**
 * SHA-256 of production schema files (or null if none).
 */
export async function hashProductionSchema(
  jobId: string
): Promise<string | null> {
  const jobDir = getJobDirectory(jobId);
  const parts: string[] = [];

  for (const name of [
    CMS_PRODUCTION_PYQS_FILENAME,
    CMS_PRODUCTION_SYLLABUS_FILENAME,
  ]) {
    const filePath = path.join(jobDir, name);
    if (!(await fileExists(filePath))) {
      continue;
    }
    const raw = await fs.readFile(filePath, "utf8");
    parts.push(`${name}:${raw}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

export function canRebuildJob(stage: PipelineStage): boolean {
  const blocked = new Set<PipelineStage>([
    PipelineStage.UPLOADED,
    PipelineStage.QUEUED,
    PipelineStage.OCR_PROCESSING,
    PipelineStage.OCR_COMPLETED,
    PipelineStage.LAYOUT_PROCESSING,
    PipelineStage.LAYOUT_COMPLETED,
    PipelineStage.DIAGRAM_EXTRACTION,
    PipelineStage.REBUILDING,
  ]);
  return !blocked.has(stage);
}
