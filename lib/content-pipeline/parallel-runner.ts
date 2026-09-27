/**
 * Configurable parallel job runner (max concurrent workers).
 */

export interface ParallelRunnerOptions {
  maxConcurrency?: number;
}

/**
 * Runs async tasks with a concurrency limit.
 */
export async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  options: ParallelRunnerOptions = {}
): Promise<void> {
  const maxConcurrency = Math.max(1, options.maxConcurrency ?? 3);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    () => runWorker()
  );

  await Promise.all(workers);
}
