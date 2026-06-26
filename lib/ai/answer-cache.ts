import crypto from "crypto";

import { getRedis } from "@/lib/redis";

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

/**
 * Generates a deterministic cache key for AI answers.
 */
export function generateCacheKey(
  question: string,
  subjectCode: string
): string {
  const normalized = `${subjectCode}:${question}`.trim().toLowerCase();

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Fetch cached AI answer.
 */
export async function getCachedAnswer(
  question: string,
  subjectCode: string
): Promise<string | null> {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  const key = generateCacheKey(question, subjectCode);

  const result = await redis.get<string>(key);

  return result ?? null;
}

/**
 * Save AI answer to cache.
 */
export async function saveAnswerToCache(
  question: string,
  subjectCode: string,
  answer: string
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const key = generateCacheKey(question, subjectCode);

  await redis.set(key, answer, {
    ex: CACHE_TTL,
  });
}
