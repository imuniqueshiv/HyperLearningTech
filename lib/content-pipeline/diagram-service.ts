import { CMS_JOB_DIAGRAMS_DIR } from "./constants";
import { extractDiagrams } from "./diagram-extractor";
import type { DiagramRunSummary } from "./diagram-metadata";
import { getJob, updateJobStatus } from "./import-queue";
import {
  readJobMetadata,
  readPipelineState,
  updateJobMetadata,
  updatePipelineState,
} from "./job-manager";
import {
  readStructuredDocument,
  writeStructuredDocument,
} from "./layout-service";
import { PipelineStage } from "./pipeline-stage";
import {
  logStageFailure,
  logStageStart,
  logStageSuccess,
} from "./stage-logger";
import { getJobDirectory } from "./temp-storage";
import type { ImportJobRecord } from "./types";
import type { StructuredDocument } from "./structured-document";

/** UI label is "Reconstruction"; pipeline stages remain DIAGRAM_*. */
const RECONSTRUCTION_TIMEOUT_MS = 60_000;

export class DiagramProcessingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DiagramProcessingError";
    this.code = code;
  }
}

export interface RunDiagramsResult {
  job: ImportJobRecord;
  summary: DiagramRunSummary;
  structuredDocument: StructuredDocument;
}

/** In-process concurrency guard — must NOT persist across crashes (unlike disk stage). */
const reconstructionInFlight = new Set<string>();

function reconstructionLog(
  message: string,
  data?: Record<string, unknown>
): void {
  const suffix = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[Reconstruction] ${message}${suffix}`);
}

async function withReconstructionTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new DiagramProcessingError(
          "RECONSTRUCTION_TIMEOUT",
          `Reconstruction exceeded ${RECONSTRUCTION_TIMEOUT_MS}ms.`
        )
      );
    }, RECONSTRUCTION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function throwIfReconstructionTimedOut(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DiagramProcessingError(
      "RECONSTRUCTION_TIMEOUT",
      `Reconstruction exceeded ${RECONSTRUCTION_TIMEOUT_MS}ms.`
    );
  }
}

/**
 * Runs diagram extraction (UI: Reconstruction) for a job after layout completes.
 * Advances: LAYOUT_COMPLETED → DIAGRAM_EXTRACTION → DIAGRAMS_READY
 */
export async function runDiagramsForJob(
  jobId: string
): Promise<RunDiagramsResult> {
  reconstructionLog("Start", { jobId });

  if (reconstructionInFlight.has(jobId)) {
    reconstructionLog("Blocked — already in-flight in this process", {
      jobId,
    });
    throw new DiagramProcessingError(
      "DIAGRAMS_IN_PROGRESS",
      "Diagram extraction is already in progress for this job."
    );
  }

  reconstructionLog("Loading job metadata");
  const metadataStarted = Date.now();
  const metadata = await readJobMetadata(jobId);
  reconstructionLog("Loaded job metadata", {
    ms: Date.now() - metadataStarted,
    found: Boolean(metadata),
  });

  if (!metadata) {
    throw new DiagramProcessingError(
      "JOB_NOT_FOUND",
      `Job not found: ${jobId}`
    );
  }

  reconstructionLog("Loading pipeline.json");
  const pipelineStarted = Date.now();
  const pipeline = await readPipelineState(jobId);
  reconstructionLog("Loaded pipeline.json", {
    ms: Date.now() - pipelineStarted,
  });
  const currentStage = pipeline?.stage ?? metadata.stage;
  reconstructionLog("Stage check", { jobId, currentStage });

  // DIAGRAM_EXTRACTION on disk is a stale crash marker and is recoverable.
  // True concurrency is guarded by reconstructionInFlight above.
  if (
    currentStage !== PipelineStage.LAYOUT_COMPLETED &&
    currentStage !== PipelineStage.DIAGRAM_EXTRACTION &&
    currentStage !== PipelineStage.DIAGRAMS_READY &&
    currentStage !== PipelineStage.FAILED &&
    currentStage !== PipelineStage.TIMEOUT &&
    currentStage !== PipelineStage.CANCELLED
  ) {
    throw new DiagramProcessingError(
      "LAYOUT_REQUIRED",
      "Diagram extraction requires LAYOUT_COMPLETED first."
    );
  }

  reconstructionLog("Loading structured-document");
  const structuredStarted = Date.now();
  const structuredDocument = await readStructuredDocument(jobId);
  reconstructionLog("Loaded structured-document", {
    ms: Date.now() - structuredStarted,
    found: Boolean(structuredDocument),
  });

  if (!structuredDocument) {
    throw new DiagramProcessingError(
      "STRUCTURED_DOCUMENT_MISSING",
      "structured-document.json not found. Run layout detection first."
    );
  }

  const startedAt = new Date().toISOString();
  reconstructionInFlight.add(jobId);

  let logStartedAt = startedAt;

  try {
    reconstructionLog("Updating stage → DIAGRAM_EXTRACTION", { jobId });
    const statusStarted = Date.now();
    await updateJobStatus(jobId, "processing", {
      stage: PipelineStage.DIAGRAM_EXTRACTION,
      error: null,
    });
    reconstructionLog("Stage update finished", {
      jobId,
      ms: Date.now() - statusStarted,
    });

    logStartedAt = await logStageStart({
      jobId,
      stage: "reconstruction",
    });

    const result = await withReconstructionTimeout((signal) =>
      runReconstructionBody({
        jobId,
        startedAt,
        logStartedAt,
        structuredDocument,
        signal,
      })
    );

    return result;
  } catch (error) {
    reconstructionLog("Failed", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });

    try {
      await logStageFailure({
        jobId,
        stage: "reconstruction",
        startedAt: logStartedAt,
        error,
      });
    } catch (logError) {
      reconstructionLog("Failed to write reconstruction.log", {
        error: logError instanceof Error ? logError.message : String(logError),
      });
    }

    const message =
      error instanceof Error ? error.message : "Diagram extraction failed.";

    await updateJobStatus(jobId, "failed", {
      stage: PipelineStage.FAILED,
      error: message,
    });

    if (error instanceof DiagramProcessingError) {
      throw error;
    }

    throw new DiagramProcessingError("DIAGRAMS_FAILED", message);
  } finally {
    reconstructionInFlight.delete(jobId);
    reconstructionLog("In-flight cleared", { jobId });
  }
}

async function runReconstructionBody(input: {
  jobId: string;
  startedAt: string;
  logStartedAt: string;
  structuredDocument: StructuredDocument;
  signal: AbortSignal;
}): Promise<RunDiagramsResult> {
  const { jobId, startedAt, logStartedAt, structuredDocument, signal } = input;

  const jobDir = getJobDirectory(jobId);
  reconstructionLog("Building clean diagram assets", {
    jobId,
    figureCount: Object.values(structuredDocument.nodes).filter(
      (node) => node.kind === "figure"
    ).length,
  });
  const extractStarted = Date.now();
  const result = await extractDiagrams({
    jobDir,
    document: structuredDocument,
  });
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Finished building diagram assets", {
    jobId,
    ms: Date.now() - extractStarted,
    diagramCount: result.diagrams.length,
  });

  reconstructionLog("Saved reconstruction (structured-document + diagrams)");
  const writeStarted = Date.now();
  await writeStructuredDocument(jobId, result.document);
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Saved reconstruction", {
    jobId,
    ms: Date.now() - writeStarted,
  });

  const completedAt = new Date().toISOString();
  const totalBytes = result.diagrams.reduce(
    (sum, diagram) => sum + diagram.fileSizeBytes,
    0
  );

  const summary: DiagramRunSummary = {
    startedAt,
    completedAt,
    durationMs: result.durationMs,
    diagramCount: result.diagrams.length,
    totalBytes,
    diagramsDir: CMS_JOB_DIAGRAMS_DIR,
    diagrams: result.diagrams.map((diagram) => ({
      id: diagram.id,
      pageNumber: diagram.pageNumber,
      filename: diagram.filename,
      path: diagram.path,
      width: diagram.width,
      height: diagram.height,
      fileSizeBytes: diagram.fileSizeBytes,
    })),
  };

  reconstructionLog("Updating stage → DIAGRAMS_READY", { jobId });
  await updateJobStatus(jobId, "queued", {
    stage: PipelineStage.DIAGRAMS_READY,
    error: null,
  });
  throwIfReconstructionTimedOut(signal);

  reconstructionLog("Loading completion metadata");
  const latestMetadata = await readJobMetadata(jobId);
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Loaded completion metadata", {
    found: Boolean(latestMetadata),
  });
  reconstructionLog("Loading completion pipeline.json");
  const latestPipeline = await readPipelineState(jobId);
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Loaded completion pipeline.json", {
    found: Boolean(latestPipeline),
  });

  if (latestMetadata) {
    reconstructionLog("Writing completion metadata");
    await updateJobMetadata({
      ...latestMetadata,
      stage: PipelineStage.DIAGRAMS_READY,
      status: "queued",
      updatedAt: completedAt,
      error: null,
    });
    throwIfReconstructionTimedOut(signal);
    reconstructionLog("Wrote completion metadata");
  }

  if (latestPipeline) {
    reconstructionLog("Writing completion pipeline.json");
    await updatePipelineState({
      ...latestPipeline,
      stage: PipelineStage.DIAGRAMS_READY,
      status: "queued",
      updatedAt: completedAt,
      error: null,
      diagrams: summary,
    });
    throwIfReconstructionTimedOut(signal);
    reconstructionLog("Wrote completion pipeline.json");
  }

  reconstructionLog("pipeline.json updated", {
    jobId,
    stage: PipelineStage.DIAGRAMS_READY,
  });

  reconstructionLog("Reloading completed job");
  const job = await getJob(jobId);
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Reloaded completed job", { found: Boolean(job) });

  if (!job) {
    throw new DiagramProcessingError(
      "JOB_HYDRATION_FAILED",
      "Diagram extraction finished but the job could not be reloaded."
    );
  }

  reconstructionLog("Writing reconstruction success log");
  await logStageSuccess({
    jobId,
    stage: "reconstruction",
    startedAt: logStartedAt,
    details: { diagramCount: summary.diagramCount },
  });
  throwIfReconstructionTimedOut(signal);
  reconstructionLog("Wrote reconstruction success log");

  reconstructionLog("Stage completed", {
    jobId,
    durationMs: summary.durationMs,
    diagramCount: summary.diagramCount,
  });

  return {
    job: {
      ...job,
      stage: PipelineStage.DIAGRAMS_READY,
      status: "queued",
      diagrams: summary,
    },
    summary,
    structuredDocument: result.document,
  };
}
