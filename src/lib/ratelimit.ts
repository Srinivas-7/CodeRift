import "server-only";
import { headers } from "next/headers";

interface MemoryLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryLimitRecord>();

// Cleanup stale memory store entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600 * 1000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * In-memory sliding window rate limiter fallback
 */
function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = oldest + windowMs;
    return { success: false, remaining: 0, reset };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: limit - record.timestamps.length,
    reset: now + windowMs,
  };
}

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  prefix: string;
}

export const RATE_LIMIT_CONFIGS = {
  LOGIN: { limit: 5, windowSeconds: 60, prefix: "ratelimit:login" },
  JOIN_GROUP: { limit: 10, windowSeconds: 600, prefix: "ratelimit:join_group" },
  CHECK_ACCOUNT: { limit: 15, windowSeconds: 60, prefix: "ratelimit:check_account" },
  VERIFY_SUBMISSION: { limit: 20, windowSeconds: 60, prefix: "ratelimit:verify_sub" },
  FAILED_INVITE: { limit: 5, windowSeconds: 900, prefix: "ratelimit:failed_invite" },
} as const;

/**
 * Safely extracts client IP from request headers in Next.js Server Actions
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // In background or non-request context
  }
  return "127.0.0.1";
}

/**
 * Check rate limit using Upstash Redis if available, or in-memory fallback
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<{ success: boolean; remaining?: number; reset?: number; error?: string }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const key = `${config.prefix}:${identifier}`;

  if (redisUrl && redisToken) {
    try {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
        prefix: config.prefix,
      });

      const result = await ratelimit.limit(identifier);
      if (!result.success) {
        return {
          success: false,
          remaining: result.remaining,
          reset: result.reset,
          error: "Rate limit exceeded. Please slow down and try again.",
        };
      }
      return { success: true, remaining: result.remaining, reset: result.reset };
    } catch (err) {
      console.warn("Upstash Redis rate limit failed, falling back to in-memory:", err);
    }
  }

  // Fallback to local memory limiter
  const windowMs = config.windowSeconds * 1000;
  const memResult = memoryRateLimit(key, config.limit, windowMs);

  if (!memResult.success) {
    return {
      success: false,
      remaining: memResult.remaining,
      reset: memResult.reset,
      error: "Too many requests. Please wait a moment before trying again.",
    };
  }

  return { success: true, remaining: memResult.remaining, reset: memResult.reset };
}
