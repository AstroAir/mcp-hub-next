/**
 * Rate Limiter
 * Implements token bucket and sliding window rate limiting
 */

export interface RateLimitOptions {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
  strategy?: 'token-bucket' | 'sliding-window';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  strategy: 'sliding-window',
};

export class RateLimiter {
  private options: Required<RateLimitOptions>;
  private requests: Map<string, RequestRecord[]> = new Map();
  private buckets: Map<string, TokenBucket> = new Map();

  constructor(options: RateLimitOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if a request is allowed
   */
  checkLimit(key: string): RateLimitResult {
    if (this.options.strategy === 'token-bucket') {
      return this.checkTokenBucket(key);
    } else {
      return this.checkSlidingWindow(key);
    }
  }

  /**
   * Token bucket algorithm
   */
  private checkTokenBucket(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.options.maxRequests,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (timeSinceRefill / this.options.windowMs) * this.options.maxRequests
    );

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.options.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + this.options.windowMs,
      };
    } else {
      const timeUntilRefill = this.options.windowMs - (now - bucket.lastRefill);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + timeUntilRefill,
        retryAfter: Math.ceil(timeUntilRefill / 1000),
      };
    }
  }

  /**
   * Sliding window algorithm
   */
  private checkSlidingWindow(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Get or create request records
    let records = this.requests.get(key) || [];

    // Remove old records outside the window
    records = records.filter((record) => record.timestamp > windowStart);

    // Count requests in current window
    const requestCount = records.reduce((sum, record) => sum + record.count, 0);

    // Check if request is allowed
    if (requestCount < this.options.maxRequests) {
      // Add new request
      records.push({ timestamp: now, count: 1 });
      this.requests.set(key, records);

      return {
        allowed: true,
        remaining: this.options.maxRequests - requestCount - 1,
        resetAt: records[0]?.timestamp + this.options.windowMs || now + this.options.windowMs,
      };
    } else {
      // Request denied
      const oldestRecord = records[0];
      const resetAt = oldestRecord.timestamp + this.options.windowMs;
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
    this.buckets.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
    this.buckets.clear();
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): { requestCount: number; count: number; limit: number; remaining: number; resetTime?: number } {
    if (this.options.strategy === 'token-bucket') {
      const bucket = this.buckets.get(key);
      const tokens = bucket?.tokens || this.options.maxRequests;
      const requestCount = this.options.maxRequests - Math.floor(tokens);
      return {
        requestCount,
        count: requestCount,
        limit: this.options.maxRequests,
        remaining: Math.floor(tokens),
        resetTime: bucket?.lastRefill ? bucket.lastRefill + this.options.windowMs : Date.now() + this.options.windowMs,
      };
    } else {
      const now = Date.now();
      const windowStart = now - this.options.windowMs;
      const records = this.requests.get(key) || [];
      const validRecords = records.filter((record) => record.timestamp > windowStart);
      const count = validRecords.reduce((sum, record) => sum + record.count, 0);

      return {
        requestCount: count,
        count,
        limit: this.options.maxRequests,
        remaining: Math.max(0, this.options.maxRequests - count),
        resetTime: windowStart + this.options.windowMs,
      };
    }
  }

  /**
   * Clean up old records
   */
  cleanup(): number {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    let removed = 0;

    // Clean up sliding window records
    for (const [key, records] of this.requests.entries()) {
      const validRecords = records.filter((record) => record.timestamp > windowStart);
      if (validRecords.length === 0) {
        this.requests.delete(key);
        removed++;
      } else {
        this.requests.set(key, validRecords);
      }
    }

    // Clean up token buckets (remove unused ones)
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > this.options.windowMs * 2) {
        this.buckets.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Request queue for rate-limited requests
 */
export class RateLimitedQueue {
  private limiter: RateLimiter;
  private queue: Array<{
    key: string;
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  private processing = false;

  constructor(options: RateLimitOptions) {
    this.limiter = new RateLimiter(options);
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject
      });
      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      const result = this.limiter.checkLimit(item.key);

      if (!result.allowed) {
        const start = Date.now();
        const waitTime = result.retryAfter ? result.retryAfter * 1000 : 1000;
        const target = start + waitTime;
        const schedule = () => {
          const remaining = target - Date.now();
          if (remaining > 0) {
            setTimeout(schedule, remaining);
            return;
          }
          this.processing = false;
          // Resume processing after wait
          void this.processQueue();
        };
        setTimeout(schedule, waitTime);
        return;
      }

      // Remove from queue and execute without blocking
      this.queue.shift();
      try {
        const promise = item.fn();
        promise.then(item.resolve).catch(item.reject);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.forEach((item) => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Global rate limiters
const limiters: Map<string, RateLimiter> = new Map();

/**
 * Get or create a rate limiter
 */
export function getRateLimiter(key: string, options: RateLimitOptions): RateLimiter {
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiter(options));
  }
  return limiters.get(key)!;
}

/**
 * Clean up all rate limiters
 */
export function cleanupRateLimiters(): void {
  limiters.forEach((limiter) => limiter.cleanup());
  limiters.clear();
}

