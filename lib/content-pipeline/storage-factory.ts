/**
 * Resolves the active content storage provider.
 * Only LocalStorageProvider is implemented (Phase 20).
 */

import {
  CMS_STORAGE_PROVIDER_ID,
  CMS_STORAGE_PROVIDER_LABEL,
} from "./constants";
import { LocalStorageProvider } from "./local-storage-provider";
import type { ContentStorageProvider } from "./storage-types";

let cached: ContentStorageProvider | null = null;

/**
 * Returns the process-wide storage provider.
 * Swap implementation here later (e.g. GitHub) without changing the pipeline.
 */
export function getStorageProvider(): ContentStorageProvider {
  if (!cached) {
    cached = new LocalStorageProvider();
  }
  return cached;
}

/** Test/helper: replace the active provider. */
export function setStorageProvider(provider: ContentStorageProvider): void {
  cached = provider;
}

export function getStorageProviderInfo() {
  return getStorageProvider().info;
}

/** Client-safe mirror of the active provider label (no fs). */
export function getConfiguredStorageProviderInfo() {
  return {
    id: CMS_STORAGE_PROVIDER_ID,
    label: CMS_STORAGE_PROVIDER_LABEL,
  } as const;
}
