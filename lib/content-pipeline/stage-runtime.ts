/**
 * Shared stage runtime: timeouts, timed awaits, heartbeats.
 */

export const STAGE_TIMEOUT_MS = {
  // Measured: JBIG2 2-page AL-402 + Tesseract = ~197s. 4-page scans need headroom.
  ocr: 420_000,
  layout: 60_000,
  reconstruction: 60_000,
  structuring: 240_000,
  schema: 60_000,
  validation: 60_000,
  writer: 120_000,
  review: 30_000,
} as const;

export type SupervisedStageId = keyof typeof STAGE_TIMEOUT_MS;

export class StageTimeoutError extends Error {
  readonly code = "STAGE_TIMEOUT";
  readonly stageId: string;
  readonly timeoutMs: number;

  constructor(stageId: string, timeoutMs: number) {
    super(`Stage "${stageId}" exceeded ${timeoutMs}ms.`);
    this.name = "StageTimeoutError";
    this.stageId = stageId;
    this.timeoutMs = timeoutMs;
  }
}

export async function timedAwait<T>(
  label: string,
  work: Promise<T>,
  options?: { logThresholdMs?: number; jobId?: string }
): Promise<T> {
  const threshold = options?.logThresholdMs ?? 1_000;
  const started = Date.now();
  const prefix = options?.jobId ? `[Pipeline][${options.jobId}]` : "[Pipeline]";
  console.log(`${prefix} ENTER ${label}`);
  try {
    const result = await work;
    const ms = Date.now() - started;
    if (ms >= threshold) {
      console.log(`${prefix} EXIT ${label}`, { ms });
    } else {
      console.log(`${prefix} EXIT ${label}`, { ms });
    }
    return result;
  } catch (error) {
    const ms = Date.now() - started;
    console.log(`${prefix} FAIL ${label}`, {
      ms,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function withStageTimeout<T>(input: {
  stageId: string;
  timeoutMs: number;
  jobId?: string;
  run: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new StageTimeoutError(input.stageId, input.timeoutMs));
    }, input.timeoutMs);
  });

  try {
    return await Promise.race([input.run(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function assertNotAborted(signal: AbortSignal, stageId: string): void {
  if (signal.aborted) {
    throw new StageTimeoutError(stageId, 0);
  }
}
