/**
 * Content storage provider types (Phase 20).
 * Pipeline stages stay identical; only the destination backend changes.
 */

export interface StorageProviderInfo {
  /** Stable machine id, e.g. "local". */
  id: string;
  /** Human-readable label for the admin dashboard. */
  label: string;
}

/**
 * Abstraction over where production content is persisted.
 * Current: LocalStorageProvider → content/
 * Future: GitHubStorageProvider, DatabaseStorageProvider, etc.
 */
export interface ContentStorageProvider {
  readonly info: StorageProviderInfo;

  /** Atomically write JSON to an absolute path. */
  saveJson(absolutePath: string, value: unknown): Promise<void>;

  /** Copy a diagram binary from source to destination. */
  saveDiagram(
    sourceAbsolute: string,
    destinationAbsolute: string
  ): Promise<void>;

  /** Backup an existing file into backupDir; returns backup absolute path. */
  createBackup(
    sourceAbsolute: string,
    backupDirAbsolute: string
  ): Promise<string>;

  /** Read JSON if present; null when missing. */
  readExisting<T>(absolutePath: string): Promise<T | null>;

  /** List file names (not recursive) in a directory. */
  listFiles(absoluteDir: string): Promise<string[]>;

  /** Whether a path exists. */
  exists(absolutePath: string): Promise<boolean>;
}
