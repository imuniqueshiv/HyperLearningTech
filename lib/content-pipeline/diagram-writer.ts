/**
 * Dedicated Diagram Writer — sole owner of diagram move/path/dedupe/manifest.
 */

import fs from "fs/promises";
import path from "path";

import { CMS_JOB_DIAGRAMS_DIR } from "./constants";
import {
  copyDiagrams,
  type DiagramCopyPlan,
  type DiagramCopyResult,
} from "./diagram-copy-service";
import {
  buildDiagramManifest,
  writeDiagramManifest,
  type DiagramManifest,
} from "./diagram-manifest";
import {
  generateProductionDiagramPath,
  isJobWorkspaceDiagramPath,
  normalizeRelativePath,
  resolveContentDiagramAbsolutePath,
  resolveJobDiagramAbsolutePath,
} from "./diagram-path-generator";
import {
  emptyDiagramWriteStats,
  type DiagramWriteStats,
} from "./diagram-write-report";
import type {
  ProductionPaper,
  ProductionPyqsJson,
  ProductionQuestionAttachment,
} from "./schema-types";

export interface DiagramWriterPrepareResult {
  pyqs: ProductionPyqsJson;
  copyPlans: DiagramCopyPlan[];
  plannedPaths: Set<string>;
}

export interface DiagramWriterExecuteResult {
  pyqs: ProductionPyqsJson;
  copyResult: DiagramCopyResult;
  stats: DiagramWriteStats;
  manifest: DiagramManifest;
}

/**
 * Phase 1: generate production paths and update attachment.path fields.
 * Does not copy files.
 */
export function prepareDiagramWrite(input: {
  pyqs: ProductionPyqsJson;
  jobDir: string;
  contentDir: string;
}): DiagramWriterPrepareResult {
  const contentDiagramsDir = path.join(input.contentDir, CMS_JOB_DIAGRAMS_DIR);
  const copyPlans: DiagramCopyPlan[] = [];
  const plannedPaths = new Set<string>();

  const papers = input.pyqs.papers.map((paper) =>
    remapPaper(paper, input.jobDir, contentDiagramsDir, copyPlans, plannedPaths)
  );

  return {
    pyqs: {
      ...input.pyqs,
      papers,
    },
    copyPlans,
    plannedPaths,
  };
}

/**
 * Phase 2: copy/reuse diagrams, apply final path remaps, write manifest.
 */
export async function executeDiagramWrite(input: {
  jobId: string;
  jobDir: string;
  contentDir: string;
  pyqs: ProductionPyqsJson;
  copyPlans: DiagramCopyPlan[];
}): Promise<DiagramWriterExecuteResult> {
  const contentDiagramsDir = path.join(input.contentDir, CMS_JOB_DIAGRAMS_DIR);
  await fs.mkdir(contentDiagramsDir, { recursive: true });

  const copyResult = await copyDiagrams(input.copyPlans, contentDiagramsDir);
  const pyqs = applyPathRemaps(input.pyqs, copyResult.pathRemaps);

  const manifest = buildDiagramManifest({
    jobId: input.jobId,
    contentDiagramsDir: toRepoRelative(contentDiagramsDir),
    entries: copyResult.entries,
    copied: copyResult.copied,
    reused: copyResult.reused,
    skipped: copyResult.skipped,
    errors: copyResult.errors,
    totalBytesCopied: copyResult.totalBytesCopied,
    destinationFolders: copyResult.destinationFolders,
  });

  const manifestPath = await writeDiagramManifest(input.jobDir, manifest);

  const stats: DiagramWriteStats = {
    diagramsCopied: copyResult.copied,
    diagramsReused: copyResult.reused,
    diagramsSkipped: copyResult.skipped,
    diagramErrors: copyResult.errors,
    storageBytesCopied: copyResult.totalBytesCopied,
    destinationFolders: copyResult.destinationFolders,
    manifestPath,
  };

  return {
    pyqs,
    copyResult,
    stats,
    manifest,
  };
}

/**
 * Collects relative paths under a content diagrams directory.
 */
export async function collectDiagramRelativePaths(
  diagramsDir: string
): Promise<Set<string>> {
  const paths = new Set<string>();

  async function walk(currentDir: string, relativePrefix: string) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relative = relativePrefix
        ? `${relativePrefix}/${entry.name}`
        : entry.name;
      const absolute = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        paths.add(relative.replace(/\\/g, "/"));
      }
    }
  }

  await walk(diagramsDir, "");
  return paths;
}

export function createEmptyDiagramStats(): DiagramWriteStats {
  return emptyDiagramWriteStats();
}

function remapPaper(
  paper: ProductionPaper,
  jobDir: string,
  contentDiagramsDir: string,
  copyPlans: DiagramCopyPlan[],
  plannedPaths: Set<string>
): ProductionPaper {
  return {
    ...paper,
    questions: paper.questions.map((question) => ({
      ...question,
      subQuestions: question.subQuestions.map((sub) => {
        if (!sub.attachments?.length) {
          return sub;
        }

        return {
          ...sub,
          attachments: sub.attachments.map((attachment) =>
            remapAttachment(
              attachment,
              paper,
              jobDir,
              contentDiagramsDir,
              copyPlans,
              plannedPaths
            )
          ),
        };
      }),
    })),
  };
}

function remapAttachment(
  attachment: ProductionQuestionAttachment,
  paper: ProductionPaper,
  jobDir: string,
  contentDiagramsDir: string,
  copyPlans: DiagramCopyPlan[],
  plannedPaths: Set<string>
): ProductionQuestionAttachment {
  const normalized = normalizeRelativePath(attachment.path);

  if (!isJobWorkspaceDiagramPath(normalized)) {
    return attachment;
  }

  const productionRelativePath = generateProductionDiagramPath(normalized, {
    month: paper.month,
    year: paper.year,
  });

  copyPlans.push({
    sourceAbsolute: resolveJobDiagramAbsolutePath(jobDir, normalized),
    destinationAbsolute: resolveContentDiagramAbsolutePath(
      contentDiagramsDir,
      productionRelativePath
    ),
    productionRelativePath,
    jobRelativePath: normalized,
  });
  plannedPaths.add(productionRelativePath);

  return {
    ...attachment,
    path: productionRelativePath,
  };
}

function applyPathRemaps(
  pyqs: ProductionPyqsJson,
  pathRemaps: Map<string, string>
): ProductionPyqsJson {
  if (pathRemaps.size === 0) {
    return pyqs;
  }

  return {
    ...pyqs,
    papers: pyqs.papers.map((paper) => ({
      ...paper,
      questions: paper.questions.map((question) => ({
        ...question,
        subQuestions: question.subQuestions.map((sub) => {
          if (!sub.attachments?.length) {
            return sub;
          }

          return {
            ...sub,
            attachments: sub.attachments.map((attachment) => {
              const current = normalizeRelativePath(attachment.path);
              const remapped = pathRemaps.get(current) ?? current;
              if (remapped === current) {
                return attachment;
              }
              return { ...attachment, path: remapped };
            }),
          };
        }),
      })),
    })),
  };
}

function toRepoRelative(absolutePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = absolutePath.replace(/\\/g, "/");
  if (normalized.startsWith(cwd + "/")) {
    return normalized.slice(cwd.length + 1);
  }
  return normalized;
}
