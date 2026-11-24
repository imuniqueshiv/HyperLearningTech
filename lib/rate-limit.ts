import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { getRedis } from "@/lib/redis";

export interface RateLimitResult {
  available: boolean;
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const SLIDING_WINDOW_SCRIPT = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now - window)
local count = redis.call("ZCARD", KEYS[1])
if count >= limit then
  return {0, count, redis.call("PTTL", KEYS[1])}
end
redis.call("ZADD", KEYS[1], now, ARGV[4])
redis.call("PEXPIRE", KEYS[1], window)
count = count + 1
return {1, count, redis.call("PTTL", KEYS[1])}
`;

function hashIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex");
}

export function getTrustedClientIdentifier(headers: Headers): string | null {
  const rawClientIp = headers.get("x-real-ip");
  if (rawClientIp === null && process.env.NODE_ENV === "development") {
    return "local-development";
  }

  const clientIp = rawClientIp?.trim();
  if (!clientIp || isIP(clientIp) === 0) {
    return null;
  }

  return clientIp;
}

export async function checkSlidingWindowRateLimit({
  identifier,
  namespace,
  limit,
  windowSeconds,
}: {
  identifier: string;
  namespace: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const unavailable: RateLimitResult = {
    available: false,
    allowed: false,
    remaining: 0,
    resetSeconds: windowSeconds,
  };
  const redis = getRedis();
  if (!redis) {
    return unavailable;
  }

  const key = `ratelimit:${namespace}:${hashIdentifier(identifier)}`;
  const windowMilliseconds = windowSeconds * 1000;

  try {
    const result = await redis.eval<
      [number, number, number, string],
      [number, number, number]
    >(
      SLIDING_WINDOW_SCRIPT,
      [key],
      [Date.now(), windowMilliseconds, limit, randomUUID()]
    );
    const [allowed, count, ttlMilliseconds] = result.map(Number);

    return {
      available: true,
      allowed: allowed === 1,
      remaining: Math.max(0, limit - count),
      resetSeconds: Math.max(1, Math.ceil(ttlMilliseconds / 1000)),
    };
  } catch (error) {
    console.error("Distributed rate limiting failed:", error);
    return unavailable;
  }
}

export async function acquireGenerationLock(
  namespace: string,
  identity: string,
  ttlSeconds = 180
): Promise<string | false | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const key = `generation-lock:${namespace}:${hashIdentifier(identity)}`;

  try {
    const token = randomUUID();
    const result = await redis.set(key, token, {
      nx: true,
      ex: ttlSeconds,
    });
    return result === "OK" ? token : false;
  } catch (error) {
    console.error("Distributed generation lock failed:", error);
    return null;
  }
}

export async function releaseGenerationLock(
  namespace: string,
  identity: string,
  token: string
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  const key = `generation-lock:${namespace}:${hashIdentifier(identity)}`;

  try {
    const result = await redis.eval<[string], [number]>(
      `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return {redis.call("DEL", KEYS[1])}
end
return {0}
`,
      [key],
      [token]
    );
    return result[0] === 1;
  } catch (error) {
    console.error("Failed to release distributed generation lock:", error);
    return false;
  }
}
