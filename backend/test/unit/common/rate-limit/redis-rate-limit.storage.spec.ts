import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';

describe('RedisRateLimitStorage', () => {
  let redisClient: Redis;
  let callSpy: jest.SpyInstance;
  let redisCacheService: { getClient: jest.Mock };
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    // `ThrottlerStorageRedisService` (from @nest-lab/throttler-storage-redis)
    // only treats its constructor argument as a ready-to-use client when it
    // is an `instanceof Redis`; otherwise it tries to build a brand new
    // ioredis connection out of it. So the fake here has to be a real
    // `ioredis` instance - `lazyConnect: true` keeps it from ever touching
    // the network, and stubbing `call` keeps every command in-process.
    redisClient = new Redis({ lazyConnect: true });
    callSpy = jest.spyOn(redisClient, 'call');
    redisCacheService = { getClient: jest.fn().mockReturnValue(redisClient) };
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    await redisClient.disconnect();
  });

  function createStorage(): RedisRateLimitStorage {
    return new RedisRateLimitStorage(
      redisCacheService as unknown as RedisCacheService,
    );
  }

  it('builds the underlying Redis storage from the injected Redis client', () => {
    createStorage();

    expect(redisCacheService.getClient).toHaveBeenCalledTimes(1);
  });

  it('increments hits via a Lua eval call scoped to the key and throttler name', async () => {
    callSpy.mockResolvedValue([1, 60_000, 0, 0]);
    const storage = createStorage();

    await storage.increment('user-1', 60_000, 5, 300_000, 'login');

    expect(callSpy).toHaveBeenCalledTimes(1);
    const args = callSpy.mock.calls[0];
    expect(args[0]).toBe('eval');
    expect(typeof args[1]).toBe('string');
    expect(args[1]).toContain('redis.call');
    expect(args.slice(2)).toEqual([
      2,
      '{user-1:login}:hits',
      '{user-1:login}:blocked',
      'login',
      60_000,
      5,
      300_000,
    ]);
  });

  it('translates a not-yet-blocked Lua script result into milliseconds-to-seconds fields', async () => {
    callSpy.mockResolvedValue([3, 45_000, 0, 0]);
    const storage = createStorage();

    const result = await storage.increment(
      'user-1',
      60_000,
      5,
      300_000,
      'login',
    );

    expect(result).toEqual({
      totalHits: 3,
      timeToExpire: 45,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('translates a blocked Lua script result, converting block duration to seconds', async () => {
    callSpy.mockResolvedValue([6, 60_000, 1, 300_000]);
    const storage = createStorage();

    const result = await storage.increment(
      'user-1',
      60_000,
      5,
      300_000,
      'login',
    );

    expect(result).toEqual({
      totalHits: 6,
      timeToExpire: 60,
      isBlocked: true,
      timeToBlockExpire: 300,
    });
  });

  it('rounds up partial-second Lua durations rather than truncating', async () => {
    callSpy.mockResolvedValue([2, 1, 1, 1]);
    const storage = createStorage();

    const result = await storage.increment(
      'user-1',
      60_000,
      5,
      300_000,
      'login',
    );

    expect(result.timeToExpire).toBe(1);
    expect(result.timeToBlockExpire).toBe(1);
  });

  it('fails open with default counters when the Redis client rejects', async () => {
    callSpy.mockRejectedValue(new Error('ECONNREFUSED'));
    const storage = createStorage();

    await expect(
      storage.increment('user-1', 60_000, 5, 300_000, 'login'),
    ).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it('fails open when the underlying Lua result is malformed', async () => {
    callSpy.mockResolvedValue('not-an-array');
    const storage = createStorage();

    await expect(
      storage.increment('user-1', 60_000, 5, 300_000, 'login'),
    ).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it('fails open when Redis does not answer before the storage timeout', async () => {
    jest.useFakeTimers();
    callSpy.mockReturnValue(new Promise(() => undefined));
    const storage = createStorage();

    const pending = storage.increment('user-1', 60_000, 5, 300_000, 'login');
    await jest.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
