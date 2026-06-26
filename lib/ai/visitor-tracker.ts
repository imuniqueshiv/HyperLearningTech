import crypto from "crypto";

import { getRedis } from "@/lib/redis";

const TTL_SECONDS = 60 * 60 * 24 * 35; // 35 days

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export interface VisitorInput {
  deviceId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface VisitorStats {
  uniqueDevices: number;
  authenticatedUsers: number;
  anonymousVisitors: number;
}

/**
 * Tracks one visitor for analytics.
 * If Redis is unavailable (e.g. GitHub Actions),
 * analytics tracking is skipped gracefully.
 */
export async function trackVisitor({
  deviceId,
  userId,
}: VisitorInput): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const day = today();

  const deviceKey = `analytics:${day}:devices`;
  const userKey = `analytics:${day}:users`;
  const anonymousKey = `analytics:${day}:anonymous`;

  const pipeline = redis.pipeline();

  pipeline.sadd(deviceKey, hash(deviceId));
  pipeline.expire(deviceKey, TTL_SECONDS);

  if (userId) {
    pipeline.sadd(userKey, hash(userId));
    pipeline.expire(userKey, TTL_SECONDS);
  } else {
    pipeline.sadd(anonymousKey, hash(deviceId));
    pipeline.expire(anonymousKey, TTL_SECONDS);
  }

  await pipeline.exec();
}

/**
 * Returns today's visitor analytics.
 * If Redis is unavailable, returns empty statistics.
 */
export async function getTodayVisitorStats(): Promise<VisitorStats> {
  const redis = getRedis();

  if (!redis) {
    return {
      uniqueDevices: 0,
      authenticatedUsers: 0,
      anonymousVisitors: 0,
    };
  }

  const day = today();

  const deviceKey = `analytics:${day}:devices`;
  const userKey = `analytics:${day}:users`;
  const anonymousKey = `analytics:${day}:anonymous`;

  const [uniqueDevices, authenticatedUsers, anonymousVisitors] =
    await Promise.all([
      redis.scard(deviceKey),
      redis.scard(userKey),
      redis.scard(anonymousKey),
    ]);

  return {
    uniqueDevices: uniqueDevices ?? 0,
    authenticatedUsers: authenticatedUsers ?? 0,
    anonymousVisitors: anonymousVisitors ?? 0,
  };
}
