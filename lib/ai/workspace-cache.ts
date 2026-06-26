import crypto from "crypto";

import { getRedis } from "@/lib/redis";

const WORKSPACE_CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

/**
 * Generates a unique cache key for Hyper AI Workspace.
 *
 * Prefix:
 * workspace:
 *
 * Different prompt types (EXPLAIN, NOTES, MCQ, etc.)
 * are isolated to avoid cache collisions.
 */
export function generateWorkspaceCacheKey(
  action: string,
  topic: string,
  subjectCode: string
): string {
  const normalized = `${subjectCode}:${action}:${topic}`.trim().toLowerCase();

  const hash = crypto.createHash("sha256").update(normalized).digest("hex");

  return `workspace:${hash}`;
}

/**
 * Fetch cached workspace response.
 */
export async function getWorkspaceCache(
  action: string,
  topic: string,
  subjectCode: string
): Promise<string | null> {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  const key = generateWorkspaceCacheKey(action, topic, subjectCode);

  const cached = await redis.get<string>(key);

  return cached ?? null;
}

/**
 * Save workspace response.
 */
export async function saveWorkspaceCache(
  action: string,
  topic: string,
  subjectCode: string,
  answer: string
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const key = generateWorkspaceCacheKey(action, topic, subjectCode);

  await redis.set(key, answer, {
    ex: WORKSPACE_CACHE_TTL,
  });
}

/**
 * Remove one cached workspace response.
 */
export async function deleteWorkspaceCache(
  action: string,
  topic: string,
  subjectCode: string
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const key = generateWorkspaceCacheKey(action, topic, subjectCode);

  await redis.del(key);
}
