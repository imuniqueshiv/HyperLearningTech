/**
 * Production diagram path / filename generation.
 * Matches existing content/rgpv diagrams naming.
 */

import path from "path";

import { CMS_JOB_DIAGRAMS_DIR } from "./constants";
import { safeTrim } from "./string-normalize";

const MONTH_SUFFIX: Record<string, string> = {
  january: "jan",
  february: "feb",
  march: "mar",
  april: "apr",
  may: "may",
  june: "june",
  july: "july",
  august: "aug",
  september: "sep",
  october: "oct",
  november: "nov",
  december: "dec",
};

export interface DiagramPathContext {
  month: string;
  year: number;
}

/**
 * Exam session folder: `june-2026`, `december-2025`, …
 */
export function buildExamFolder(month: string, year: number): string {
  const normalized = safeTrim(month).toLowerCase() || "unknown";
  return `${normalized}-${year}`;
}

/**
 * Filename suffix month token used in production: `june`, `dec`, `nov`, …
 */
export function buildMonthSuffix(month: string): string {
  const normalized = safeTrim(month).toLowerCase();
  return MONTH_SUFFIX[normalized] ?? (normalized.slice(0, 3) || "unk");
}

/**
 * Builds production relative path under diagrams/: `june-2026/Q.1-a-june-2026.webp`
 * (attachment.path in pyqs.json — no `diagrams/` prefix).
 */
export function generateProductionDiagramPath(
  jobRelativePath: string,
  context: DiagramPathContext
): string {
  const normalized = normalizeRelativePath(jobRelativePath);
  const filename = path.posix.basename(normalized);
  const extension = path.posix.extname(filename) || ".webp";
  const basename = filename.slice(0, filename.length - extension.length);
  const folder = buildExamFolder(context.month, context.year);
  const suffix = buildMonthSuffix(context.month);
  const yearToken = String(context.year);
  const suffixToken = `-${suffix}-${yearToken}`;

  const finalBase = basename.toLowerCase().endsWith(suffixToken.toLowerCase())
    ? basename
    : `${basename}${suffixToken}`;

  return `${folder}/${finalBase}${extension}`;
}

export function generateProductionFilename(
  jobRelativePath: string,
  context: DiagramPathContext
): string {
  return path.posix.basename(
    generateProductionDiagramPath(jobRelativePath, context)
  );
}

export function isJobWorkspaceDiagramPath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return (
    normalized === CMS_JOB_DIAGRAMS_DIR ||
    normalized.startsWith(`${CMS_JOB_DIAGRAMS_DIR}/`)
  );
}

export function normalizeRelativePath(relativePath: string): string {
  return safeTrim(relativePath).replace(/\\/g, "/").replace(/^\/+/, "");
}

export function resolveContentDiagramAbsolutePath(
  contentDiagramsDir: string,
  productionRelativePath: string
): string {
  const normalized = normalizeRelativePath(productionRelativePath);
  return path.join(contentDiagramsDir, ...normalized.split("/"));
}

export function resolveJobDiagramAbsolutePath(
  jobDir: string,
  jobRelativePath: string
): string {
  const normalized = normalizeRelativePath(jobRelativePath);
  return path.join(jobDir, ...normalized.split("/"));
}
