/**
 * Simple in-memory rate limiter for API routes
 *
 * Note: This is suitable for single-instance deployments.
 * For multi-instance deployments (e.g., Vercel with multiple regions),
 * consider using Redis or Upstash for distributed rate limiting.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store for rate limit data
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
};

export type RateLimitResult = {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  resetAt: number;
};

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or expired entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  // Existing entry within window
  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 * Handles common proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Real IP header
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback
  return "unknown";
}
