/**
 * Diagram duplicate detection via content hash.
 */

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export interface HashedFile {
  absolutePath: string;
  relativePath: string;
  hash: string;
  size: number;
}

/**
 * SHA-256 hex digest of a file.
 */
export async function hashFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Builds a hash → file index for all files under a diagrams directory.
 */
export async function buildDiagramHashIndex(
  diagramsDir: string
): Promise<Map<string, HashedFile>> {
  const index = new Map<string, HashedFile>();

  async function walk(currentDir: string, relativePrefix: string) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relative = relativePrefix
        ? `${relativePrefix}/${entry.name}`
        : entry.name;
      const absolute = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolute, relative);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      try {
        const stats = await fs.stat(absolute);
        const hash = await hashFile(absolute);
        if (!index.has(hash)) {
          index.set(hash, {
            absolutePath: absolute,
            relativePath: relative.replace(/\\/g, "/"),
            hash,
            size: stats.size,
          });
        }
      } catch {
        // Skip unreadable files; continue indexing.
      }
    }
  }

  await walk(diagramsDir, "");
  return index;
}

/**
 * Finds an existing file with the same content hash, if any.
 */
export function findDuplicateByHash(
  index: Map<string, HashedFile>,
  hash: string
): HashedFile | null {
  return index.get(hash) ?? null;
}
