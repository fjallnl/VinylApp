type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  rateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets = globalForRateLimit.rateLimitBuckets ?? new Map<string, RateLimitBucket>();

if (!globalForRateLimit.rateLimitBuckets) {
  globalForRateLimit.rateLimitBuckets = buckets;
}

type RateLimitOptions = {
  disabled?: boolean;
};

function parsePositiveInt(rawValue: string | undefined, fallback: number) {
  if (!rawValue) return fallback;
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getRateLimitLimit(envName: string, fallback: number) {
  return parsePositiveInt(process.env[envName], fallback);
}

export function getRateLimitWindowMs(envName: string, fallbackSeconds: number) {
  return parsePositiveInt(process.env[envName], fallbackSeconds) * 1000;
}

export function isRateLimitDisabled(envName = "EMAIL_VERIFICATION_RATE_LIMIT_DISABLED") {
  return process.env[envName] === "true";
}

export function checkRateLimit(key: string, limit: number, windowMs: number, options?: RateLimitOptions) {
  if (options?.disabled) {
    return { allowed: true as const, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true as const, retryAfterSeconds: 0 };
}
