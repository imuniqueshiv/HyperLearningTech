/**
 * Persistent import history storage under .cms/history/
 */

import fs from "fs/promises";
import path from "path";

import type { ImportHistoryRecord } from "./history-types";
import { writeJsonAtomic } from "./json-writer";
import { readJsonFile } from "./json-reader";

const HISTORY_DIR = path.join(process.cwd(), ".cms", "history");
const HISTORY_INDEX = "index.json";

export function getHistoryDir(): string {
  return HISTORY_DIR;
}

export function getHistoryRecordPath(jobId: string): string {
  return path.join(HISTORY_DIR, `${jobId}.json`);
}

export function getHistoryIndexPath(): string {
  return path.join(HISTORY_DIR, HISTORY_INDEX);
}

async function ensureHistoryDir(): Promise<void> {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

export async function readHistoryIndex(): Promise<string[]> {
  const index = await readJsonFile<string[]>(getHistoryIndexPath());
  return Array.isArray(index) ? index : [];
}

export async function writeHistoryIndex(jobIds: string[]): Promise<void> {
  await ensureHistoryDir();
  await writeJsonAtomic(getHistoryIndexPath(), jobIds);
}

export async function readHistoryRecord(
  jobId: string
): Promise<ImportHistoryRecord | null> {
  return readJsonFile<ImportHistoryRecord>(getHistoryRecordPath(jobId));
}

export async function writeHistoryRecord(
  record: ImportHistoryRecord
): Promise<void> {
  await ensureHistoryDir();
  await writeJsonAtomic(getHistoryRecordPath(record.jobId), record);

  const index = await readHistoryIndex();
  const next = [record.jobId, ...index.filter((id) => id !== record.jobId)];
  await writeHistoryIndex(next);
}

export async function listHistoryRecords(): Promise<ImportHistoryRecord[]> {
  const index = await readHistoryIndex();
  const records: ImportHistoryRecord[] = [];

  for (const jobId of index) {
    const record = await readHistoryRecord(jobId);
    if (record) {
      records.push(record);
    }
  }

  return records;
}
