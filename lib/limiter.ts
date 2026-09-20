interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (record.resetAt <= now) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * In-memory sliding rate limiter for API routes.
 *
 * @param ip Client IP address or identifier
 * @param maxRequests Maximum allowed requests in window (default: 30)
 * @param windowMs Time window in milliseconds (default: 60,000 ms / 1 minute)
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || record.resetAt <= now) {
    ipMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}
