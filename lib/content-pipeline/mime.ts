import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  type AcceptedUploadMimeType,
} from "./constants";

const MIME_TO_EXTENSION: Record<AcceptedUploadMimeType, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/tiff": ".tiff",
};

const ACCEPTED_MIME_SET = new Set<string>(ACCEPTED_UPLOAD_MIME_TYPES);

/**
 * Returns true when the MIME type is in the supported upload set.
 * Validation is MIME-based — filename extension is ignored.
 */
export function isSupportedMimeType(
  mimeType: string
): mimeType is AcceptedUploadMimeType {
  return ACCEPTED_MIME_SET.has(mimeType.trim().toLowerCase());
}

/**
 * Maps a supported MIME type to the extension used for the stored original file.
 */
export function getExtensionForMimeType(
  mimeType: AcceptedUploadMimeType
): string {
  return MIME_TO_EXTENSION[mimeType];
}

/**
 * Normalizes a MIME type string for comparison.
 */
export function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}
