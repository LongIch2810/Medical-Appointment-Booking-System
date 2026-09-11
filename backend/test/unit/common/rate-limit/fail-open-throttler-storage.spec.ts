import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { FailOpenThrottlerStorage } from 'src/common/rate-limit/fail-open-throttler-storage';

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

describe('FailOpenThrottlerStorage', () => {
  let delegate: { increment: jest.Mock };
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    delegate = { increment: jest.fn() };
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns the Redis storage result unchanged', async () => {
    const expected: ThrottlerStorageRecord = {
      totalHits: 2,
      timeToExpire: 30,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
    delegate.increment.mockResolvedValue(expected);
    const storage = new FailOpenThrottlerStorage(
      delegate as unknown as ThrottlerStorage,
    );

    await expect(
      storage.increment('key', 60_000, 100, 60_000, 'default'),
    ).resolves.toBe(expected);
    expect(delegate.increment).toHaveBeenCalledWith(
      'key',
      60_000,
      100,
      60_000,
      'default',
    );
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('allows requests when Redis fails', async () => {
    delegate.increment.mockRejectedValue(new Error('Redis unavailable'));
    const storage = new FailOpenThrottlerStorage(
      delegate as unknown as ThrottlerStorage,
    );

    await expect(
      storage.increment('key', 60_000, 100, 60_000, 'default'),
    ).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it('allows requests when Redis does not answer before the timeout', async () => {
    jest.useFakeTimers();
    delegate.increment.mockReturnValue(new Promise(() => undefined));
    const storage = new FailOpenThrottlerStorage(
      delegate as unknown as ThrottlerStorage,
      Date.now,
      500,
    );

    const result = storage.increment('key', 60_000, 100, 60_000, 'default');
    await jest.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toEqual({
      totalHits: 0,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it('logs repeated Redis failures at most once per minute', async () => {
    let currentTime = 0;
    delegate.increment.mockRejectedValue(new Error('Redis unavailable'));
    const storage = new FailOpenThrottlerStorage(
      delegate as unknown as ThrottlerStorage,
      () => currentTime,
    );

    await storage.increment('key', 60_000, 100, 60_000, 'default');
    currentTime = 59_999;
    await storage.increment('key', 60_000, 100, 60_000, 'default');
    currentTime = 60_000;
    await storage.increment('key', 60_000, 100, 60_000, 'default');

    expect(loggerError).toHaveBeenCalledTimes(2);
  });
});
