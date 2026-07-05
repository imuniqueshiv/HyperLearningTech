// lib/ai/topic-cache.ts

import { getRedis } from "@/lib/redis";
import type { TopicCache } from "@/types/topic-cache";

const CACHE_PREFIX = "topic:";
const CACHE_VERSION = 1;

/**
 * Build Redis cache key.
 */
function buildCacheKey(topicId: string): string {
  return `${CACHE_PREFIX}${topicId}`;
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
  topicId: string
): Promise<TopicCache | null> {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  try {
    const cache = await redis.get<TopicCache>(buildCacheKey(topicId));

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
  cache: Omit<TopicCache, "generatedAt" | "version">
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.set(buildCacheKey(cache.topicId), {
      ...cache,
      generatedAt: new Date().toISOString(),
      version: CACHE_VERSION,
    });
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
  topicId: string
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  try {
    await redis.del(buildCacheKey(topicId));
  } catch (error) {
    console.error("Failed to delete topic cache:", error);
  }
}
