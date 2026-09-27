/**
 * Diagram write manifest types and persistence.
 */

import path from "path";

import { CMS_DIAGRAM_MANIFEST_FILENAME } from "./constants";
import { readJsonFile } from "./json-reader";
import { writeJsonAtomic } from "./json-writer";

export { CMS_DIAGRAM_MANIFEST_FILENAME };

export interface DiagramManifestEntry {
  originalPath: string;
  newPath: string;
  filename: string;
  size: number;
  hash: string | null;
  copied: boolean;
  reused: boolean;
  skipped: boolean;
  error: string | null;
  sourceAbsolute: string;
  destinationAbsolute: string;
}

export interface DiagramManifest {
  jobId: string;
  writtenAt: string;
  contentDiagramsDir: string;
  entries: DiagramManifestEntry[];
  statistics: {
    total: number;
    copied: number;
    reused: number;
    skipped: number;
    errors: number;
    totalBytesCopied: number;
    destinationFolders: string[];
  };
}

export function buildDiagramManifest(input: {
  jobId: string;
  contentDiagramsDir: string;
  entries: DiagramManifestEntry[];
  copied: number;
  reused: number;
  skipped: number;
  errors: number;
  totalBytesCopied: number;
  destinationFolders: string[];
}): DiagramManifest {
  return {
    jobId: input.jobId,
    writtenAt: new Date().toISOString(),
    contentDiagramsDir: input.contentDiagramsDir,
    entries: input.entries,
    statistics: {
      total: input.entries.length,
      copied: input.copied,
      reused: input.reused,
      skipped: input.skipped,
      errors: input.errors,
      totalBytesCopied: input.totalBytesCopied,
      destinationFolders: input.destinationFolders,
    },
  };
}

export function getDiagramManifestPath(jobDir: string): string {
  return path.join(jobDir, CMS_DIAGRAM_MANIFEST_FILENAME);
}

export async function writeDiagramManifest(
  jobDir: string,
  manifest: DiagramManifest
): Promise<string> {
  const manifestPath = getDiagramManifestPath(jobDir);
  await writeJsonAtomic(manifestPath, manifest);
  return CMS_DIAGRAM_MANIFEST_FILENAME;
}

export async function readDiagramManifest(
  jobDir: string
): Promise<DiagramManifest | null> {
  return readJsonFile<DiagramManifest>(getDiagramManifestPath(jobDir));
}
