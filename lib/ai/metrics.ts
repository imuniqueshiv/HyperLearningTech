import { saveMetric } from "./analytics-storage";

export type MetricEvent =
  | "CACHE_HIT"
  | "CACHE_MISS"
  | "GENERATION_SUCCESS"
  | "GENERATION_FAILED"
  | "GENERATION_RETRY";

export interface MetricPayload {
  subjectCode?: string;
  durationMs?: number;
  message?: string;
}

export interface MetricRecord extends MetricPayload {
  event: MetricEvent;
  timestamp: string;
}

export async function trackMetric(
  event: MetricEvent,
  payload: MetricPayload = {}
): Promise<void> {
  const metric: MetricRecord = {
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  console.log("[AI_METRIC]", metric);

  try {
    await saveMetric(metric);
  } catch (error) {
    console.error("[AI_METRIC_STORAGE_FAILED]", error);
  }
}