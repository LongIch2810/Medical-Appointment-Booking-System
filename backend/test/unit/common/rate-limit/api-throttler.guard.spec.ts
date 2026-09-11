import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ApiThrottlerGuard } from 'src/common/rate-limit/api-throttler.guard';
import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_MESSAGE,
} from 'src/common/rate-limit/rate-limit.constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');

@Controller('rate-limit-test')
class RateLimitTestController {
  @Get()
  getValue() {
    return { ok: true };
  }
}

@Module({
  imports: [ThrottlerModule.forRoot([{ limit: 2, ttl: 60_000 }])],
  controllers: [RateLimitTestController],
  providers: [{ provide: APP_GUARD, useClass: ApiThrottlerGuard }],
})
class RateLimitTestModule {}

describe('ApiThrottlerGuard', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RateLimitTestModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns headers below the limit and the standard 429 response above it', async () => {
    const first = await request(app.getHttpServer()).get('/rate-limit-test');
    const second = await request(app.getHttpServer()).get('/rate-limit-test');
    const blocked = await request(app.getHttpServer()).get('/rate-limit-test');

    expect(first.status).toBe(200);
    expect(first.headers['x-ratelimit-limit']).toBe('2');
    expect(second.status).toBe(200);
    expect(second.headers['x-ratelimit-remaining']).toBe('0');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.body).toEqual({
      statusCode: 429,
      success: false,
      data: null,
      error: {
        code: RATE_LIMIT_ERROR_CODE,
        details: RATE_LIMIT_ERROR_MESSAGE,
      },
    });
  });
});
