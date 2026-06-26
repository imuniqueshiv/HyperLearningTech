import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[Redis] Upstash environment variables are not configured. Redis cache is disabled."
    );

    return null;
  }

  redisInstance = new Redis({
    url,
    token,
  });

  return redisInstance;
}
