import crypto from "crypto";
import { redis } from "@/lib/redis";

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

export function generateCacheKey(
  question: string,
  subjectCode: string
): string {
  const normalized = `${subjectCode}:${question}`.trim().toLowerCase();

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export async function getCachedAnswer(
  question: string,
  subjectCode: string
): Promise<string | null> {
  const key = generateCacheKey(question, subjectCode);

  const result = await redis.get<string>(key);

  return result ?? null;
}

export async function saveAnswerToCache(
  question: string,
  subjectCode: string,
  answer: string
): Promise<void> {
  const key = generateCacheKey(question, subjectCode);

  await redis.set(key, answer, {
    ex: CACHE_TTL,
  });
}
