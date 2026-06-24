export type MetricEvent =
  | "CACHE_HIT"
  | "CACHE_MISS"
  | "GENERATION_SUCCESS"
  | "GENERATION_FAILED"
  | "GENERATION_RETRY";

interface MetricPayload {
  subjectCode?: string;
  durationMs?: number;
  message?: string;
}

export function trackMetric(event: MetricEvent, payload?: MetricPayload) {
  const timestamp = new Date().toISOString();

  console.log(
    JSON.stringify({
      timestamp,
      event,
      ...payload,
    })
  );
}
