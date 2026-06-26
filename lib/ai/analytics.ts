// lib/ai/analytics.ts

import { getTodayAnalytics } from "@/lib/ai/analytics-storage";

export interface DashboardAnalytics {
  requests: number;
  cacheHit: number;
  cacheMiss: number;
  cacheHitRate: number;
  geminiCalls: number;
  failed: number;
  retries: number;
  averageResponseMs: number;
  averageResponseSeconds: string;
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const analytics = await getTodayAnalytics();

  const totalCache = analytics.cacheHit + analytics.cacheMiss;

  const cacheHitRate =
    totalCache === 0
      ? 0
      : Number(((analytics.cacheHit / totalCache) * 100).toFixed(1));

  return {
    requests: analytics.requests,

    cacheHit: analytics.cacheHit,

    cacheMiss: analytics.cacheMiss,

    // Every cache miss results in a Gemini request
    geminiCalls: analytics.cacheMiss,

    failed: analytics.generationFailed,

    retries: analytics.generationRetry,

    averageResponseMs: analytics.averageResponseMs,

    averageResponseSeconds: (analytics.averageResponseMs / 1000).toFixed(2),

    cacheHitRate,
  };
}
