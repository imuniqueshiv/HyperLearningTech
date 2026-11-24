// lib/ai/topic-cache.ts

import { getRedis } from "@/lib/redis";
import type { TopicCache } from "@/types/topic-cache";
import crypto from "crypto";
import { randomUUID } from "node:crypto";

const CACHE_PREFIX = "topic:";
const CACHE_VERSION = 1;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCK_TTL_SECONDS = 180;

export interface TopicCacheContext {
  branch: string;
  semester: string;
  subjectCode: string;
  topicId: string;
}

/**
 * Build Redis cache key.
 */
function buildCacheKey(context: TopicCacheContext): string {
  const identity = [
    context.branch.trim().toLowerCase(),
    context.semester.trim().toLowerCase(),
    context.subjectCode.trim().toLowerCase(),
    context.topicId.trim(),
  ].join(":");
  const hash = crypto.createHash("sha256").update(identity).digest("hex");
  return `${CACHE_PREFIX}${hash}`;
}

/**
 * Read cached topic answer.
 *
 * Returns null when:
 * - Redis is unavailable
 * - Cache doesn't exist
 * - Cache version is outdated
 */
export async function getTopicCache(
  context: TopicCacheContext
): Promise<TopicCache | null> {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  try {
    const cache = await redis.get<TopicCache>(buildCacheKey(context));

    if (!cache) {
      return null;
    }

    if (cache.version !== CACHE_VERSION) {
      return null;
    }

    return cache;
  } catch (error) {
    console.error("Failed to read topic cache:", error);

    return null;
  }
}

/**
 * Save or overwrite a cached topic answer.
 */
export async function saveTopicCache(
  context: TopicCacheContext,
  cache: Omit<TopicCache, "generatedAt" | "version">
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.set(
      buildCacheKey(context),
      {
        ...cache,
        generatedAt: new Date().toISOString(),
        version: CACHE_VERSION,
      },
      {
        ex: CACHE_TTL_SECONDS,
      }
    );
  } catch (error) {
    console.error("Failed to save topic cache:", error);
  }
}

/**
 * Delete a cached topic.
 *
 * Used by forceRefresh and future admin tools.
 */
export async function deleteTopicCache(
  context: TopicCacheContext
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.del(buildCacheKey(context));
  } catch (error) {
    console.error("Failed to delete topic cache:", error);
  }
}

export async function acquireTopicGenerationLock(
  context: TopicCacheContext
): Promise<string | false | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const token = randomUUID();
    const result = await redis.set(
      `topic-generation-lock:${buildCacheKey(context).slice(CACHE_PREFIX.length)}`,
      token,
      { nx: true, ex: LOCK_TTL_SECONDS }
    );
    return result === "OK" ? token : false;
  } catch (error) {
    console.error("Failed to acquire topic generation lock:", error);
    return null;
  }
}

export async function releaseTopicGenerationLock(
  context: TopicCacheContext,
  token: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.eval<[string], [number]>(
      `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return {redis.call("DEL", KEYS[1])}
end
return {0}
`,
      [
        `topic-generation-lock:${buildCacheKey(context).slice(CACHE_PREFIX.length)}`,
      ],
      [token]
    );
  } catch (error) {
    console.error("Failed to release topic generation lock:", error);
  }
}
