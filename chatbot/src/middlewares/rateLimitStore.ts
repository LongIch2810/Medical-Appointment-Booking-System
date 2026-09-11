import type { Redis } from "ioredis";

/** Trả về số lần request trong cửa sổ hiện tại của `key`, sau khi tăng thêm 1. */
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
}

/**
 * Store in-memory — chỉ dùng khi không có Redis (ví dụ unit test không cần
 * chứng minh chia sẻ quota giữa nhiều replica). KHÔNG dùng cho production
 * nhiều replica vì mỗi process giữ bucket riêng.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const existing = this.buckets.get(key);
    const bucket =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existing;
    bucket.count += 1;
    this.buckets.set(key, bucket);

    if (this.buckets.size > 5_000) {
      for (const [bucketKey, value] of this.buckets) {
        if (value.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }

    return bucket.count;
  }
}

/**
 * Store dùng Redis — atomic INCR + PEXPIRE(NX) trong một MULTI, cho phép
 * nhiều chatbot replica (hoặc nhiều process test) chia sẻ đúng một quota
 * cho cùng một key.
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redis: Redis) {}

  async increment(key: string, windowMs: number): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    // NX: chỉ set TTL lần đầu tiên tạo key trong cửa sổ — các lần INCR sau
    // trong cùng cửa sổ không làm trôi (reset) thời điểm hết hạn.
    multi.pexpire(key, windowMs, "NX");
    const results = await multi.exec();
    if (!results) {
      throw new Error("Redis MULTI/EXEC returned no results");
    }
    const [incrError, count] = results[0];
    if (incrError) throw incrError;
    return count as number;
  }
}
