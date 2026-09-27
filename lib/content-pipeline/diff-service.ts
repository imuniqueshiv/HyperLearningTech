/**
 * Diff service wrappers for Review Center.
 */

import { diffJson } from "./json-diff";
import type { JsonDiffResult } from "./review-types";

export function diffPyqsJson(
  existing: unknown | null,
  pending: unknown | null
): JsonDiffResult {
  return diffJson(existing ?? null, pending ?? null, "pyqs.json");
}

export function diffSyllabusJson(
  existing: unknown | null,
  pending: unknown | null
): JsonDiffResult {
  return diffJson(existing ?? null, pending ?? null, "syllabus.json");
}

export function summarizeDiffCounts(diff: JsonDiffResult): {
  added: number;
  removed: number;
  modified: number;
  total: number;
} {
  return {
    added: diff.addedCount,
    removed: diff.removedCount,
    modified: diff.modifiedCount,
    total: diff.entries.length,
  };
}
