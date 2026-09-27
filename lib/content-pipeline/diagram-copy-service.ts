/**
 * Diagram copy execution with hash-based reuse.
 */

import fs from "fs/promises";
import path from "path";

import {
  buildDiagramHashIndex,
  findDuplicateByHash,
  hashFile,
  type HashedFile,
} from "./diagram-deduplicator";
import type { DiagramManifestEntry } from "./diagram-manifest";
import { fileExists } from "./json-reader";
import { getStorageProvider } from "./storage-factory";

export interface DiagramCopyPlan {
  sourceAbsolute: string;
  destinationAbsolute: string;
  /** Attachment path relative to diagrams/ (e.g. june-2026/Q.1-a-june-2026.webp). */
  productionRelativePath: string;
  jobRelativePath: string;
}

export interface DiagramCopyResult {
  entries: DiagramManifestEntry[];
  copied: number;
  reused: number;
  skipped: number;
  errors: number;
  totalBytesCopied: number;
  destinationFolders: string[];
  /** Final production relative path for each job-relative source (after reuse remaps). */
  pathRemaps: Map<string, string>;
}

/**
 * Copies planned diagrams into content diagrams dir.
 * Identical content (by hash) reuses an existing file instead of copying again.
 * Per-file failures are recorded; remaining plans continue.
 */
export async function copyDiagrams(
  plans: DiagramCopyPlan[],
  contentDiagramsDir: string
): Promise<DiagramCopyResult> {
  const entries: DiagramManifestEntry[] = [];
  const pathRemaps = new Map<string, string>();
  const destinationFolders = new Set<string>();
  let copied = 0;
  let reused = 0;
  let skipped = 0;
  let errors = 0;
  let totalBytesCopied = 0;

  const hashIndex = await buildDiagramHashIndex(contentDiagramsDir);
  const seenDestinations = new Set<string>();

  for (const plan of plans) {
    const folder = plan.productionRelativePath.split("/")[0];
    if (folder) {
      destinationFolders.add(folder);
    }

    try {
      const sourceExists = await fileExists(plan.sourceAbsolute);
      if (!sourceExists) {
        skipped += 1;
        entries.push(
          buildEntry(plan, {
            copied: false,
            reused: false,
            skipped: true,
            error: "Source file missing.",
            hash: null,
            size: 0,
            finalRelativePath: plan.productionRelativePath,
          })
        );
        pathRemaps.set(plan.jobRelativePath, plan.productionRelativePath);
        pathRemaps.set(
          plan.productionRelativePath,
          plan.productionRelativePath
        );
        continue;
      }

      const sourceHash = await hashFile(plan.sourceAbsolute);
      const sourceStats = await fs.stat(plan.sourceAbsolute);
      const duplicate = findDuplicateByHash(hashIndex, sourceHash);

      if (duplicate) {
        reused += 1;
        entries.push(
          buildEntry(plan, {
            copied: false,
            reused: true,
            skipped: false,
            error: null,
            hash: sourceHash,
            size: sourceStats.size,
            finalRelativePath: duplicate.relativePath,
            finalAbsolutePath: duplicate.absolutePath,
          })
        );
        pathRemaps.set(plan.jobRelativePath, duplicate.relativePath);
        pathRemaps.set(plan.productionRelativePath, duplicate.relativePath);
        continue;
      }

      const destKey = plan.destinationAbsolute
        .replace(/\\/g, "/")
        .toLowerCase();
      if (seenDestinations.has(destKey)) {
        skipped += 1;
        entries.push(
          buildEntry(plan, {
            copied: false,
            reused: false,
            skipped: true,
            error: "Duplicate destination in same write batch.",
            hash: sourceHash,
            size: sourceStats.size,
            finalRelativePath: plan.productionRelativePath,
          })
        );
        pathRemaps.set(plan.jobRelativePath, plan.productionRelativePath);
        pathRemaps.set(
          plan.productionRelativePath,
          plan.productionRelativePath
        );
        continue;
      }
      seenDestinations.add(destKey);

      if (await fileExists(plan.destinationAbsolute)) {
        skipped += 1;
        entries.push(
          buildEntry(plan, {
            copied: false,
            reused: false,
            skipped: true,
            error: "Destination exists with different content.",
            hash: sourceHash,
            size: sourceStats.size,
            finalRelativePath: plan.productionRelativePath,
          })
        );
        pathRemaps.set(plan.jobRelativePath, plan.productionRelativePath);
        pathRemaps.set(
          plan.productionRelativePath,
          plan.productionRelativePath
        );
        continue;
      }

      await fs.mkdir(path.dirname(plan.destinationAbsolute), {
        recursive: true,
      });
      await getStorageProvider().saveDiagram(
        plan.sourceAbsolute,
        plan.destinationAbsolute
      );

      const hashed: HashedFile = {
        absolutePath: plan.destinationAbsolute,
        relativePath: plan.productionRelativePath,
        hash: sourceHash,
        size: sourceStats.size,
      };
      hashIndex.set(sourceHash, hashed);

      copied += 1;
      totalBytesCopied += sourceStats.size;
      entries.push(
        buildEntry(plan, {
          copied: true,
          reused: false,
          skipped: false,
          error: null,
          hash: sourceHash,
          size: sourceStats.size,
          finalRelativePath: plan.productionRelativePath,
          finalAbsolutePath: plan.destinationAbsolute,
        })
      );
      pathRemaps.set(plan.jobRelativePath, plan.productionRelativePath);
      pathRemaps.set(plan.productionRelativePath, plan.productionRelativePath);
    } catch (error) {
      errors += 1;
      skipped += 1;
      const message =
        error instanceof Error ? error.message : "Diagram copy failed.";
      entries.push(
        buildEntry(plan, {
          copied: false,
          reused: false,
          skipped: true,
          error: message,
          hash: null,
          size: 0,
          finalRelativePath: plan.productionRelativePath,
        })
      );
      pathRemaps.set(plan.jobRelativePath, plan.productionRelativePath);
      pathRemaps.set(plan.productionRelativePath, plan.productionRelativePath);
    }
  }

  return {
    entries,
    copied,
    reused,
    skipped,
    errors,
    totalBytesCopied,
    destinationFolders: [...destinationFolders].sort(),
    pathRemaps,
  };
}

function buildEntry(
  plan: DiagramCopyPlan,
  outcome: {
    copied: boolean;
    reused: boolean;
    skipped: boolean;
    error: string | null;
    hash: string | null;
    size: number;
    finalRelativePath: string;
    finalAbsolutePath?: string;
  }
): DiagramManifestEntry {
  return {
    originalPath: plan.jobRelativePath,
    newPath: outcome.finalRelativePath,
    filename: path.posix.basename(outcome.finalRelativePath),
    size: outcome.size,
    hash: outcome.hash,
    copied: outcome.copied,
    reused: outcome.reused,
    skipped: outcome.skipped,
    error: outcome.error,
    sourceAbsolute: plan.sourceAbsolute,
    destinationAbsolute: outcome.finalAbsolutePath ?? plan.destinationAbsolute,
  };
}
