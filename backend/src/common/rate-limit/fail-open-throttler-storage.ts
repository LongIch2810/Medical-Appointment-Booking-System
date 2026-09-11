import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import {
  RATE_LIMIT_STORAGE_LOG_COOLDOWN_MS,
  RATE_LIMIT_STORAGE_TIMEOUT_MS,
} from './rate-limit.constants';

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

export class FailOpenThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(FailOpenThrottlerStorage.name);
  private lastErrorLogAt: number | null = null;

  constructor(
    private readonly storage: ThrottlerStorage,
    private readonly now: () => number = Date.now,
    private readonly timeoutMs = RATE_LIMIT_STORAGE_TIMEOUT_MS,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.incrementWithTimeout(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    } catch (error) {
      this.logStorageError(error);

      return {
        totalHits: 0,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  private async incrementWithTimeout(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error('Redis rate-limit storage timed out')),
        this.timeoutMs,
      );
    });

    try {
      return await Promise.race([
        this.storage.increment(key, ttl, limit, blockDuration, throttlerName),
        timeoutPromise,
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private logStorageError(error: unknown): void {
    const currentTime = this.now();
    if (
      this.lastErrorLogAt !== null &&
      currentTime - this.lastErrorLogAt < RATE_LIMIT_STORAGE_LOG_COOLDOWN_MS
    ) {
      return;
    }

    this.lastErrorLogAt = currentTime;
    const trace = error instanceof Error ? error.stack : String(error);
    this.logger.error(
      'Redis rate-limit storage is unavailable; allowing requests temporarily.',
      trace,
    );
  }
}
