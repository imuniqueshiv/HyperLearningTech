/**
 * Local filesystem storage provider — writes into content/.
 */

import fs from "fs/promises";
import path from "path";

import { readJsonFile } from "./json-reader";
import { backupFile, writeJsonAtomic } from "./json-writer";
import {
  CMS_STORAGE_PROVIDER_ID,
  CMS_STORAGE_PROVIDER_LABEL,
} from "./constants";
import type { ContentStorageProvider } from "./storage-types";

export class LocalStorageProvider implements ContentStorageProvider {
  readonly info = {
    id: CMS_STORAGE_PROVIDER_ID,
    label: CMS_STORAGE_PROVIDER_LABEL,
  } as const;

  async saveJson(absolutePath: string, value: unknown): Promise<void> {
    await writeJsonAtomic(absolutePath, value);
  }

  async saveDiagram(
    sourceAbsolute: string,
    destinationAbsolute: string
  ): Promise<void> {
    await fs.mkdir(path.dirname(destinationAbsolute), { recursive: true });
    await fs.copyFile(sourceAbsolute, destinationAbsolute);
  }

  async createBackup(
    sourceAbsolute: string,
    backupDirAbsolute: string
  ): Promise<string> {
    return backupFile(sourceAbsolute, backupDirAbsolute);
  }

  async readExisting<T>(absolutePath: string): Promise<T | null> {
    return readJsonFile<T>(absolutePath);
  }

  async listFiles(absoluteDir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  async exists(absolutePath: string): Promise<boolean> {
    try {
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }
}
