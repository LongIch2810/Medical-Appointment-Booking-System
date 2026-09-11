import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { WsRateLimitGuard } from 'src/websockets/ws-rate-limit.guard';
import { RateLimitModule } from 'src/common/rate-limit/rate-limit.module';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';

describe('RateLimitModule', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('wires the configured storage into the global throttler guard', async () => {
    const storage: ThrottlerStorage = {
      increment: jest.fn().mockResolvedValue({
        totalHits: 0,
        timeToExpire: 60,
        isBlocked: false,
        timeToBlockExpire: 0,
      }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [RateLimitModule],
      providers: [WsRateLimitGuard],
    })
      .overrideProvider(RedisCacheService)
      .useValue({})
      .overrideProvider(RedisRateLimitStorage)
      .useValue(storage)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    expect(moduleRef.get(RedisRateLimitStorage)).toBe(storage);
    expect(moduleRef.get(WsRateLimitGuard)).toBeInstanceOf(WsRateLimitGuard);
  });
});
