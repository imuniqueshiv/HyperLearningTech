import { ACCEPTED_JOB_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import type { JobType } from "./types";

/**
 * Formats a byte count for admin UI display.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

/**
 * Returns true when the value is a known JobType.
 */
export function isJobType(value: unknown): value is JobType {
  return (
    typeof value === "string" &&
    (ACCEPTED_JOB_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Shared upload validation helpers (no I/O).
 * Safe to use from both client and server.
 */
export function validateUploadConstraints(input: {
  mimeType: string;
  fileSize: number;
  hasFile: boolean;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.hasFile) {
    return {
      ok: false,
      code: "FILE_REQUIRED",
      message: "A file is required.",
    };
  }

  if (!input.mimeType || !input.mimeType.trim()) {
    return {
      ok: false,
      code: "MIME_MISSING",
      message: "File MIME type could not be detected.",
    };
  }

  if (input.fileSize <= 0) {
    return {
      ok: false,
      code: "FILE_EMPTY",
      message: "Empty files are not allowed.",
    };
  }

  if (input.fileSize > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `File exceeds the maximum size of ${formatFileSize(MAX_UPLOAD_BYTES)}.`,
    };
  }

  return { ok: true };
}
