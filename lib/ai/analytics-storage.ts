import { getRedis } from "@/lib/redis";

import type { MetricRecord } from "./metrics";

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function saveMetric(metric: MetricRecord): Promise<void> {
  const redis = getRedis();

  // Skip analytics if Redis is unavailable
  if (!redis) {
    return;
  }

  const day = todayKey();
  const base = `analytics:${day}`;

  const pipeline = redis.pipeline();

  // Total requests
  pipeline.incr(`${base}:requests`);

  switch (metric.event) {
    case "CACHE_HIT":
      pipeline.incr(`${base}:cache_hit`);
      break;

    case "CACHE_MISS":
      pipeline.incr(`${base}:cache_miss`);
      break;

    case "GENERATION_SUCCESS":
      pipeline.incr(`${base}:generation_success`);

      if (metric.durationMs !== undefined) {
        pipeline.incrby(`${base}:response_total_ms`, metric.durationMs);
        pipeline.incr(`${base}:response_count`);
      }

      break;

    case "GENERATION_FAILED":
      pipeline.incr(`${base}:generation_failed`);
      break;

    case "GENERATION_RETRY":
      pipeline.incr(`${base}:generation_retry`);
      break;
  }

  if (metric.subjectCode) {
    pipeline.incr(`${base}:subject:${metric.subjectCode}`);
  }

  await pipeline.exec();
}

export interface AnalyticsSnapshot {
  requests: number;
  cacheHit: number;
  cacheMiss: number;
  generationSuccess: number;
  generationFailed: number;
  generationRetry: number;
  averageResponseMs: number;
}

export async function getTodayAnalytics(): Promise<AnalyticsSnapshot> {
  const redis = getRedis();

  // Return empty analytics if Redis is unavailable
  if (!redis) {
    return {
      requests: 0,
      cacheHit: 0,
      cacheMiss: 0,
      generationSuccess: 0,
      generationFailed: 0,
      generationRetry: 0,
      averageResponseMs: 0,
    };
  }

  const day = todayKey();
  const base = `analytics:${day}`;

  const [
    requests,
    cacheHit,
    cacheMiss,
    generationSuccess,
    generationFailed,
    generationRetry,
    responseTotalMs,
    responseCount,
  ] = await Promise.all([
    redis.get<number>(`${base}:requests`),
    redis.get<number>(`${base}:cache_hit`),
    redis.get<number>(`${base}:cache_miss`),
    redis.get<number>(`${base}:generation_success`),
    redis.get<number>(`${base}:generation_failed`),
    redis.get<number>(`${base}:generation_retry`),
    redis.get<number>(`${base}:response_total_ms`),
    redis.get<number>(`${base}:response_count`),
  ]);

  const totalMs = responseTotalMs ?? 0;
  const totalResponses = responseCount ?? 0;

  return {
    requests: requests ?? 0,
    cacheHit: cacheHit ?? 0,
    cacheMiss: cacheMiss ?? 0,
    generationSuccess: generationSuccess ?? 0,
    generationFailed: generationFailed ?? 0,
    generationRetry: generationRetry ?? 0,
    averageResponseMs:
      totalResponses === 0 ? 0 : Math.round(totalMs / totalResponses),
  };
}
