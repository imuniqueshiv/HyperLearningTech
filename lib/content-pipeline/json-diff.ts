/**
 * Deep JSON diff for Review Center.
 */

import type {
  DiffChangeKind,
  JsonDiffEntry,
  JsonDiffResult,
} from "./review-types";

/**
 * Compares two JSON values and returns a flat list of path-level changes.
 */
export function diffJson(
  before: unknown,
  after: unknown,
  label: string
): JsonDiffResult {
  const entries: JsonDiffEntry[] = [];
  walk(before, after, "", entries);

  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  for (const entry of entries) {
    if (entry.kind === "added") addedCount += 1;
    if (entry.kind === "removed") removedCount += 1;
    if (entry.kind === "modified") modifiedCount += 1;
  }

  return {
    label,
    entries,
    addedCount,
    removedCount,
    modifiedCount,
  };
}

function walk(
  before: unknown,
  after: unknown,
  path: string,
  entries: JsonDiffEntry[]
): void {
  if (isEqual(before, after)) {
    return;
  }

  const beforeIsObj = isPlainObject(before);
  const afterIsObj = isPlainObject(after);
  const beforeIsArr = Array.isArray(before);
  const afterIsArr = Array.isArray(after);

  if (before === undefined || before === null) {
    if (after !== undefined && after !== null) {
      push(entries, path, "added", before, after);
    }
    return;
  }

  if (after === undefined || after === null) {
    push(entries, path, "removed", before, after);
    return;
  }

  if (beforeIsArr && afterIsArr) {
    diffArrays(before, after, path, entries);
    return;
  }

  if (beforeIsObj && afterIsObj) {
    const keys = new Set([
      ...Object.keys(before as Record<string, unknown>),
      ...Object.keys(after as Record<string, unknown>),
    ]);
    for (const key of [...keys].sort()) {
      const nextPath = path ? `${path}.${key}` : key;
      walk(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        nextPath,
        entries
      );
    }
    return;
  }

  push(entries, path, "modified", before, after);
}

function diffArrays(
  before: unknown[],
  after: unknown[],
  path: string,
  entries: JsonDiffEntry[]
): void {
  // Prefer id-based matching for academic collections.
  if (canMatchById(before) && canMatchById(after)) {
    const beforeMap = toIdMap(before);
    const afterMap = toIdMap(after);
    const ids = new Set([...beforeMap.keys(), ...afterMap.keys()]);

    for (const id of [...ids].sort()) {
      const nextPath = `${path}[id=${id}]`;
      const left = beforeMap.get(id);
      const right = afterMap.get(id);
      if (left === undefined) {
        push(entries, nextPath, "added", undefined, right);
      } else if (right === undefined) {
        push(entries, nextPath, "removed", left, undefined);
      } else {
        walk(left, right, nextPath, entries);
      }
    }
    return;
  }

  // Paper matching by exam+year+month
  if (canMatchByPaper(before) && canMatchByPaper(after)) {
    const beforeMap = toPaperMap(before);
    const afterMap = toPaperMap(after);
    const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

    for (const key of [...keys].sort()) {
      const nextPath = `${path}[paper=${key}]`;
      const left = beforeMap.get(key);
      const right = afterMap.get(key);
      if (left === undefined) {
        push(
          entries,
          nextPath,
          "added",
          undefined,
          right,
          `+ New paper ${key}`
        );
      } else if (right === undefined) {
        push(
          entries,
          nextPath,
          "removed",
          left,
          undefined,
          `- Removed paper ${key}`
        );
      } else {
        walk(left, right, nextPath, entries);
      }
    }
    return;
  }

  const max = Math.max(before.length, after.length);
  for (let i = 0; i < max; i += 1) {
    const nextPath = `${path}[${i}]`;
    if (i >= before.length) {
      push(entries, nextPath, "added", undefined, after[i]);
    } else if (i >= after.length) {
      push(entries, nextPath, "removed", before[i], undefined);
    } else {
      walk(before[i], after[i], nextPath, entries);
    }
  }
}

function canMatchById(items: unknown[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (item) =>
        isPlainObject(item) && typeof (item as { id?: unknown }).id === "string"
    )
  );
}

function canMatchByPaper(items: unknown[]): boolean {
  return (
    items.length > 0 &&
    items.every(
      (item) =>
        isPlainObject(item) &&
        typeof (item as { exam?: unknown }).exam === "string" &&
        typeof (item as { year?: unknown }).year === "number"
    )
  );
}

function toIdMap(items: unknown[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const item of items) {
    const id = String((item as { id: string }).id);
    map.set(id, item);
  }
  return map;
}

function toPaperMap(items: unknown[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const item of items) {
    const paper = item as { exam: string; year: number; month?: string };
    const key =
      `${paper.month ?? ""}-${paper.year}-${paper.exam}`.toLowerCase();
    map.set(key, item);
  }
  return map;
}

function push(
  entries: JsonDiffEntry[],
  path: string,
  kind: DiffChangeKind,
  before: unknown,
  after: unknown,
  summary?: string
): void {
  const displayPath = path || "(root)";
  let autoSummary = summary;
  if (!autoSummary) {
    if (kind === "added") {
      autoSummary = `+ Added ${displayPath}`;
    } else if (kind === "removed") {
      autoSummary = `- Removed ${displayPath}`;
    } else {
      autoSummary = `~ Modified ${displayPath}`;
    }
  }

  entries.push({
    path: displayPath,
    kind,
    before,
    after,
    summary: autoSummary,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
