import fs from "fs/promises";
import path from "path";

const CONTENT_BASE_DIR = path.join(process.cwd(), "content", "rgpv");
const DIAGRAMS_DIR_NAME = "diagrams";

export interface AttachmentPathInput {
  branch: string;
  semester: string;
  subject: string;
  attachmentPath: string;
}

function normalizeSegment(value: string): string {
  return value.toLowerCase();
}

function normalizeAttachmentRelativePath(
  attachmentPath: string
): string | null {
  const normalized = attachmentPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();

  if (!normalized || normalized.includes("..")) {
    return null;
  }

  return normalized;
}

function getDiagramsBaseDir(
  branch: string,
  semester: string,
  subject: string
): string {
  return path.join(
    CONTENT_BASE_DIR,
    normalizeSegment(branch),
    normalizeSegment(semester),
    normalizeSegment(subject),
    DIAGRAMS_DIR_NAME
  );
}

/**
 * Resolves the on-disk filesystem path for an attachment.
 * Returns null when the path is invalid or escapes the diagrams directory.
 */
export function resolveAttachmentFilesystemPath(
  input: AttachmentPathInput
): string | null {
  const relativePath = normalizeAttachmentRelativePath(input.attachmentPath);

  if (!relativePath) {
    return null;
  }

  const diagramsDir = getDiagramsBaseDir(
    input.branch,
    input.semester,
    input.subject
  );

  const filePath = path.join(diagramsDir, ...relativePath.split("/"));
  const resolvedPath = path.resolve(filePath);
  const resolvedDiagramsDir = path.resolve(diagramsDir);

  if (
    resolvedPath !== resolvedDiagramsDir &&
    !resolvedPath.startsWith(resolvedDiagramsDir + path.sep)
  ) {
    return null;
  }

  return resolvedPath;
}

/**
 * Returns the absolute URL path used to render an attachment in the browser.
 */
export function getAttachmentPath(input: AttachmentPathInput): string {
  const relativePath = normalizeAttachmentRelativePath(input.attachmentPath);

  if (!relativePath) {
    return "";
  }

  const encodedSegments = [
    encodeURIComponent(normalizeSegment(input.branch)),
    encodeURIComponent(normalizeSegment(input.semester)),
    encodeURIComponent(normalizeSegment(input.subject)),
    ...relativePath.split("/").map(encodeURIComponent),
  ];

  return `/api/content/attachments/${encodedSegments.join("/")}`;
}

export async function attachmentFileExists(
  input: AttachmentPathInput
): Promise<boolean> {
  const filePath = resolveAttachmentFilesystemPath(input);

  if (!filePath) {
    return false;
  }

  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
