/**
 * In-memory sliding window rate limiter.
 * Each user gets a window of timestamps. Old entries are pruned on each check.
 * Resets on server restart (fine for serverless like Vercel).
 */

type RateLimitEntry = {
    timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Unique identifier for this limiter (e.g., "clarify", "generate") */
    identifier: string;
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number; // timestamp when the oldest entry expires
}

export function checkRateLimit(
    userId: string,
    config: RateLimitConfig
): RateLimitResult {
    const key = `${config.identifier}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Prune old entries outside the window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        return {
            success: false,
            remaining: 0,
            resetAt: oldestInWindow + config.windowMs,
        };
    }

    entry.timestamps.push(now);
    return {
        success: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetAt: now + config.windowMs,
    };
}

// Pre-configured limiters
export const RATE_LIMITS = {
    clarify: { identifier: "clarify", maxRequests: 20, windowMs: 60 * 60 * 1000 },
    generate: { identifier: "generate", maxRequests: 10, windowMs: 60 * 60 * 1000 },
    rank: { identifier: "rank", maxRequests: 10, windowMs: 60 * 60 * 1000 },
} as const;
