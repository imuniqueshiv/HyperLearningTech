import fs from "fs/promises";
import path from "path";

import type { AcceptedUploadMimeType } from "./constants";
import { isSupportedMimeType, normalizeMimeType } from "./mime";
import type { SourceFileRef, UploadJobMetadata } from "./types";

export type DocumentKind = "pdf" | "image";

export interface LoadedDocument {
  absolutePath: string;
  buffer: Buffer;
  mimeType: AcceptedUploadMimeType;
  kind: DocumentKind;
  filename: string;
}

/**
 * Loads an uploaded original file from the job workspace.
 */
export async function loadDocumentFile(
  absolutePath: string,
  mimeTypeHint?: string
): Promise<LoadedDocument> {
  const buffer = await fs.readFile(absolutePath);
  const mimeType = normalizeMimeType(
    mimeTypeHint || guessMimeFromPath(absolutePath)
  );

  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported document MIME type: ${mimeType}`);
  }

  return {
    absolutePath,
    buffer,
    mimeType,
    kind: mimeType === "application/pdf" ? "pdf" : "image",
    filename: path.basename(absolutePath),
  };
}

/**
 * Loads all source documents for an Import Session (PDF or ordered images).
 */
export async function loadSessionDocuments(
  metadata: Pick<
    UploadJobMetadata,
    "originalFilePath" | "mimeType" | "sourceFiles"
  >
): Promise<LoadedDocument[]> {
  const sources: SourceFileRef[] =
    metadata.sourceFiles && metadata.sourceFiles.length > 0
      ? [...metadata.sourceFiles].sort((a, b) => a.pageNumber - b.pageNumber)
      : [
          {
            absolutePath: metadata.originalFilePath,
            relativePath: path.basename(metadata.originalFilePath),
            originalFilename: path.basename(metadata.originalFilePath),
            mimeType: metadata.mimeType,
            fileSize: 0,
            pageNumber: 1,
          },
        ];

  const documents: LoadedDocument[] = [];
  for (const source of sources) {
    documents.push(
      await loadDocumentFile(source.absolutePath, source.mimeType)
    );
  }
  return documents;
}

function guessMimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".tif":
    case ".tiff":
      return "image/tiff";
    default:
      return "";
  }
}
