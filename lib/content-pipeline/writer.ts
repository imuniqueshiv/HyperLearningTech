import fs from "fs/promises";
import path from "path";

import { sortProductionPyqs, sortProductionSyllabus } from "./content-sorter";
import { CMS_JOB_DIAGRAMS_DIR } from "./constants";
import type { DiagramCopyPlan } from "./diagram-copy-service";
import {
  collectDiagramRelativePaths,
  createEmptyDiagramStats,
  executeDiagramWrite,
  prepareDiagramWrite,
} from "./diagram-writer";
import type { DiagramWriteStats } from "./diagram-write-report";
import { getStorageProvider } from "./storage-factory";
import type { ContentStorageProvider } from "./storage-types";
import { mergeProductionContent } from "./merge-service";
import type {
  ProductionPyqsJson,
  ProductionSyllabusJson,
  ValidationIssue,
  ValidationReport,
} from "./schema-types";
import { createIssue } from "./validation-report";
import { buildWriteReport, type WriteReport } from "./write-report";
import { validateForWrite } from "./writer-validator";

export interface WriteProductionInput {
  jobId: string;
  jobDir: string;
  contentDir: string;
  backupDir: string;
  incomingPyqs: ProductionPyqsJson | null;
  incomingSyllabus: ProductionSyllabusJson | null;
  existingPyqs: ProductionPyqsJson | null;
  existingSyllabus: ProductionSyllabusJson | null;
  existingPyqsPath: string | null;
  existingSyllabusPath: string | null;
  preValidation: ValidationReport | null;
  /**
   * preview — merge/validate and return pending JSON (no content/ writes).
   * commit — copy diagrams and write content/ (Local Save).
   */
  mode?: "preview" | "commit";
  /** Override storage backend (defaults to getStorageProvider()). */
  storage?: ContentStorageProvider;
  /** Called around diagram copy for pipeline stage updates. */
  onDiagramsWriting?: () => Promise<void>;
  onDiagramsWritten?: () => Promise<void>;
}

export interface WriteProductionResult {
  report: WriteReport;
  pendingPyqs: ProductionPyqsJson | null;
  pendingSyllabus: ProductionSyllabusJson | null;
  copyPlans: DiagramCopyPlan[];
}

/**
 * Core writer: Diagram Writer prepare → merge → sort → validate →
 * (optional) Diagram Writer execute → atomic JSON write.
 * Writes nothing to content/ when mode is "preview" or validation fails.
 */
export async function writeProductionContent(
  input: WriteProductionInput
): Promise<WriteProductionResult> {
  const mode = input.mode ?? "commit";
  const started = Date.now();
  const warnings: ValidationIssue[] = [];
  let issueIndex = 0;
  const nextIndex = () => {
    issueIndex += 1;
    return issueIndex;
  };

  const contentDiagramsDir = path.join(input.contentDir, CMS_JOB_DIAGRAMS_DIR);
  const pyqsTargetPath = path.join(input.contentDir, "pyqs.json");
  const syllabusTargetPath = path.join(input.contentDir, "syllabus.json");

  let remappedIncomingPyqs = input.incomingPyqs;
  let copyPlans: DiagramCopyPlan[] = [];
  let plannedPaths = new Set<string>();

  if (input.incomingPyqs) {
    const prepared = prepareDiagramWrite({
      pyqs: input.incomingPyqs,
      jobDir: input.jobDir,
      contentDir: input.contentDir,
    });
    remappedIncomingPyqs = prepared.pyqs;
    copyPlans = prepared.copyPlans;
    plannedPaths = prepared.plannedPaths;
  }

  const merged = mergeProductionContent({
    existingPyqs: input.existingPyqs,
    incomingPyqs: remappedIncomingPyqs,
    existingSyllabus: input.existingSyllabus,
    incomingSyllabus: input.incomingSyllabus,
  });

  let sortedPyqs = merged.pyqs ? sortProductionPyqs(merged.pyqs) : null;
  const sortedSyllabus = merged.syllabus
    ? sortProductionSyllabus(merged.syllabus)
    : null;

  const existingDiagramPaths =
    await collectDiagramRelativePaths(contentDiagramsDir);
  const validationPaths = new Set<string>([
    ...existingDiagramPaths,
    ...plannedPaths,
  ]);

  const postValidation = validateForWrite({
    pyqs: sortedPyqs,
    syllabus: sortedSyllabus,
    existingPaths: validationPaths,
    pyqsPath: sortedPyqs ? "pyqs.json" : null,
    syllabusPath: sortedSyllabus ? "syllabus.json" : null,
  });

  if (postValidation.status === "FAILED") {
    return {
      report: buildWriteReport({
        status: "FAILED",
        writtenAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        contentDir: toRepoRelative(input.contentDir),
        filesCreated: [],
        filesModified: [],
        papersAdded: 0,
        questionsAdded: 0,
        subQuestionsAdded: 0,
        modulesAdded: 0,
        topicsAdded: 0,
        attachmentsCopied: 0,
        attachmentsSkipped: 0,
        diagrams: createEmptyDiagramStats(),
        backupsCreated: [],
        warnings: postValidation.warnings,
        errors: postValidation.errors,
        preValidation: input.preValidation,
        postValidation,
      }),
      pendingPyqs: sortedPyqs,
      pendingSyllabus: sortedSyllabus,
      copyPlans,
    };
  }

  // Preview mode: return merged JSON without touching content/.
  if (mode === "preview") {
    return {
      report: buildWriteReport({
        status: "SUCCESS",
        writtenAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        contentDir: toRepoRelative(input.contentDir),
        filesCreated: [],
        filesModified: [],
        papersAdded: merged.pyqStats.papersAdded,
        questionsAdded: merged.pyqStats.questionsAdded,
        subQuestionsAdded: merged.pyqStats.subQuestionsAdded,
        modulesAdded: merged.syllabusStats.modulesAdded,
        topicsAdded: merged.syllabusStats.topicsAdded,
        attachmentsCopied: 0,
        attachmentsSkipped: 0,
        diagrams: {
          ...createEmptyDiagramStats(),
          destinationFolders: [
            ...new Set(
              copyPlans.map((plan) => plan.productionRelativePath.split("/")[0])
            ),
          ].filter(Boolean) as string[],
        },
        backupsCreated: [],
        warnings: postValidation.warnings,
        errors: [],
        preValidation: input.preValidation,
        postValidation,
      }),
      pendingPyqs: sortedPyqs,
      pendingSyllabus: sortedSyllabus,
      copyPlans,
    };
  }

  const storage = input.storage ?? getStorageProvider();
  const filesCreated: string[] = [];
  const filesModified: string[] = [];
  const backupsCreated: string[] = [];

  await fs.mkdir(input.contentDir, { recursive: true });
  await fs.mkdir(input.backupDir, { recursive: true });

  if (sortedPyqs && (await storage.exists(pyqsTargetPath))) {
    const backupPath = await storage.createBackup(
      pyqsTargetPath,
      input.backupDir
    );
    backupsCreated.push(toRepoRelative(backupPath));
  }

  if (sortedSyllabus && (await storage.exists(syllabusTargetPath))) {
    const backupPath = await storage.createBackup(
      syllabusTargetPath,
      input.backupDir
    );
    backupsCreated.push(toRepoRelative(backupPath));
  }

  let diagramStats: DiagramWriteStats = createEmptyDiagramStats();

  if (sortedPyqs && copyPlans.length > 0) {
    await input.onDiagramsWriting?.();

    const executed = await executeDiagramWrite({
      jobId: input.jobId,
      jobDir: input.jobDir,
      contentDir: input.contentDir,
      pyqs: sortedPyqs,
      copyPlans,
    });

    sortedPyqs = sortProductionPyqs(executed.pyqs);
    diagramStats = executed.stats;

    await input.onDiagramsWritten?.();
  } else if (sortedPyqs) {
    await input.onDiagramsWriting?.();
    const executed = await executeDiagramWrite({
      jobId: input.jobId,
      jobDir: input.jobDir,
      contentDir: input.contentDir,
      pyqs: sortedPyqs,
      copyPlans: [],
    });
    diagramStats = executed.stats;
    await input.onDiagramsWritten?.();
  }

  if (sortedPyqs) {
    const existed = await storage.exists(pyqsTargetPath);
    await storage.saveJson(pyqsTargetPath, sortedPyqs);
    const relative = toRepoRelative(pyqsTargetPath);
    if (existed) {
      filesModified.push(relative);
    } else {
      filesCreated.push(relative);
    }
  }

  if (sortedSyllabus) {
    const existed = await storage.exists(syllabusTargetPath);
    await storage.saveJson(syllabusTargetPath, sortedSyllabus);
    const relative = toRepoRelative(syllabusTargetPath);
    if (existed) {
      filesModified.push(relative);
    } else {
      filesCreated.push(relative);
    }
  }

  warnings.push(...postValidation.warnings);

  if (
    diagramStats.diagramsCopied === 0 &&
    diagramStats.diagramsReused === 0 &&
    copyPlans.length > 0
  ) {
    warnings.push(
      createIssue({
        severity: "warning",
        code: "DIAGRAMS_SKIPPED",
        message: `${copyPlans.length} diagram plan(s) resulted in no new or reused files.`,
        path: "diagrams",
        index: nextIndex(),
      })
    );
  }

  return {
    report: buildWriteReport({
      status: "SUCCESS",
      writtenAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      contentDir: toRepoRelative(input.contentDir),
      filesCreated,
      filesModified,
      papersAdded: merged.pyqStats.papersAdded,
      questionsAdded: merged.pyqStats.questionsAdded,
      subQuestionsAdded: merged.pyqStats.subQuestionsAdded,
      modulesAdded: merged.syllabusStats.modulesAdded,
      topicsAdded: merged.syllabusStats.topicsAdded,
      attachmentsCopied: diagramStats.diagramsCopied,
      attachmentsSkipped: diagramStats.diagramsSkipped,
      diagrams: diagramStats,
      backupsCreated,
      warnings,
      errors: [],
      preValidation: input.preValidation,
      postValidation,
    }),
    pendingPyqs: sortedPyqs,
    pendingSyllabus: sortedSyllabus,
    copyPlans,
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
