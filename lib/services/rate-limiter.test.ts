/**
 * Rate Limiter Service Tests
 * Tests for rate limiting strategies and queue management
 */

import {
  RateLimiter,
  RateLimitedQueue,
  getRateLimiter,
  cleanupRateLimiters,
} from './rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Token Bucket Strategy', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter.checkLimit('test-key');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Use up all tokens
      for (let i = 0; i < 3; i++) {
        await limiter.checkLimit('test-key');
      }

      // Next request should be blocked
      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Use all tokens
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      // Should be blocked
      let result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(false);

      // Advance time to refill tokens
      jest.advanceTimersByTime(1000);

      // Should be allowed again
      result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
    });

    it('should handle multiple keys independently', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Use tokens for key1
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1');

      // key1 should be blocked
      let result = await limiter.checkLimit('key1');
      expect(result.allowed).toBe(false);

      // key2 should still be allowed
      result = await limiter.checkLimit('key2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Sliding Window Strategy', () => {
    it('should allow requests within window', async () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      // Should allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await limiter.checkLimit('test-key');
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding window limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      // Use up limit
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      // Should be blocked
      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(false);
    });

    it('should allow requests after window slides', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      // Make 2 requests
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      // Advance time past window
      jest.advanceTimersByTime(1100);

      // Should be allowed again
      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
    });

    it('should clean up old timestamps', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      // Make requests
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      // Advance time
      jest.advanceTimersByTime(1100);

      // Make new request (should clean up old timestamps)
      await limiter.checkLimit('test-key');

      const usage = limiter.getUsage('test-key');
      expect(usage.requestCount).toBe(1); // Only the recent request
    });
  });

  describe('reset', () => {
    it('should reset limits for a specific key', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Use up limit
      await limiter.checkLimit('test-key');
      let result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(false);

      // Reset
      limiter.reset('test-key');

      // Should be allowed again
      result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('should reset all limits', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      // Use up limits for multiple keys
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key2');

      // Reset all
      limiter.resetAll();

      // Both should be allowed again
      let result = await limiter.checkLimit('key1');
      expect(result.allowed).toBe(true);

      result = await limiter.checkLimit('key2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('getUsage', () => {
    it('should return usage statistics', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      const usage = limiter.getUsage('test-key');
      expect(usage).toMatchObject({
        requestCount: 2,
        limit: 5,
        remaining: 3,
        resetTime: expect.any(Number),
      });
    });

    it('should return zero usage for unknown key', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'token-bucket',
      });

      const usage = limiter.getUsage('unknown-key');
      expect(usage.requestCount).toBe(0);
      expect(usage.remaining).toBe(5);
    });
  });

  describe('cleanup', () => {
    it('should remove old entries', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        strategy: 'sliding-window',
      });

      await limiter.checkLimit('key1');
      await limiter.checkLimit('key2');

      // Advance time past window
      jest.advanceTimersByTime(2000);

      // Cleanup
      const removed = limiter.cleanup();
      expect(removed).toBeGreaterThan(0);
    });
  });
});

describe('RateLimitedQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should process tasks within rate limit', async () => {
    const queue = new RateLimitedQueue({
      maxRequests: 2,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const task1 = jest.fn().mockResolvedValue('result1');
    const task2 = jest.fn().mockResolvedValue('result2');

    const promise1 = queue.enqueue('key1', task1);
    const promise2 = queue.enqueue('key1', task2);

    // Process queue
    jest.runAllTimers();
    await Promise.resolve();

    expect(task1).toHaveBeenCalled();
    expect(task2).toHaveBeenCalled();
  });

  it('should delay tasks when rate limited', async () => {
    const queue = new RateLimitedQueue({
      maxRequests: 1,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const task1 = jest.fn().mockResolvedValue('result1');
    const task2 = jest.fn().mockResolvedValue('result2');

    queue.enqueue('key1', task1);
    queue.enqueue('key1', task2);

    // First task should execute immediately
    await jest.runOnlyPendingTimersAsync();
    expect(task1).toHaveBeenCalled();
    expect(task2).not.toHaveBeenCalled();

    // Advance time to allow second task
    jest.advanceTimersByTime(1000);
    await jest.runOnlyPendingTimersAsync();
    expect(task2).toHaveBeenCalled();
  });

  it('should handle task errors', async () => {
    const queue = new RateLimitedQueue({
      maxRequests: 2,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const error = new Error('Task failed');
    const task = jest.fn().mockRejectedValue(error);

    const promise = queue.enqueue('key1', task);

    jest.runAllTimers();

    await expect(promise).rejects.toThrow('Task failed');
  });

  it('should process multiple keys independently', async () => {
    const queue = new RateLimitedQueue({
      maxRequests: 1,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const task1 = jest.fn().mockResolvedValue('result1');
    const task2 = jest.fn().mockResolvedValue('result2');

    queue.enqueue('key1', task1);
    queue.enqueue('key2', task2);

    // Both should execute (different keys)
    await jest.runOnlyPendingTimersAsync();
    expect(task1).toHaveBeenCalled();
    expect(task2).toHaveBeenCalled();
  });

  it('should return task results', async () => {
    const queue = new RateLimitedQueue({
      maxRequests: 2,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const task = jest.fn().mockResolvedValue('success');
    const promise = queue.enqueue('key1', task);

    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe('success');
  });
});

describe('Global Rate Limiter Functions', () => {
  beforeEach(() => {
    cleanupRateLimiters();
  });

  describe('getRateLimiter', () => {
    it('should create and cache rate limiter', () => {
      const limiter1 = getRateLimiter('test-limiter', {
        maxRequests: 5,
        windowMs: 1000,
      });

      const limiter2 = getRateLimiter('test-limiter', {
        maxRequests: 10,
        windowMs: 2000,
      });

      // Should return the same instance
      expect(limiter1).toBe(limiter2);
    });

    it('should create different limiters for different names', () => {
      const limiter1 = getRateLimiter('limiter1', {
        maxRequests: 5,
        windowMs: 1000,
      });

      const limiter2 = getRateLimiter('limiter2', {
        maxRequests: 5,
        windowMs: 1000,
      });

      expect(limiter1).not.toBe(limiter2);
    });

    it('should use default options when not provided', () => {
      const limiter = getRateLimiter('test-limiter');
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('cleanupRateLimiters', () => {
    it('should remove all cached limiters', () => {
      const limiter1 = getRateLimiter('limiter1', {
        maxRequests: 5,
        windowMs: 1000,
      });

      const limiter2 = getRateLimiter('limiter2', {
        maxRequests: 5,
        windowMs: 1000,
      });

      cleanupRateLimiters();

      // Getting limiters again should create new instances
      const newLimiter1 = getRateLimiter('limiter1', {
        maxRequests: 5,
        windowMs: 1000,
      });

      expect(newLimiter1).not.toBe(limiter1);
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle zero maxRequests', async () => {
    const limiter = new RateLimiter({
      maxRequests: 0,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const result = await limiter.checkLimit('test-key');
    expect(result.allowed).toBe(false);
  });

  it('should handle very large maxRequests', async () => {
    const limiter = new RateLimiter({
      maxRequests: 1000000,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    const result = await limiter.checkLimit('test-key');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999999);
  });

  it('should handle concurrent requests', async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      strategy: 'token-bucket',
    });

    // Make 10 concurrent requests
    const promises = Array.from({ length: 10 }, () =>
      limiter.checkLimit('test-key')
    );

    const results = await Promise.all(promises);

    // First 5 should be allowed
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(5);

    // Last 5 should be blocked
    const blocked = results.filter((r) => !r.allowed).length;
    expect(blocked).toBe(5);
  });
});

