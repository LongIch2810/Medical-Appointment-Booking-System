import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import { ApiThrottlerGuard } from './api-throttler.guard';
import { GLOBAL_RATE_LIMIT } from './rate-limit.constants';
import { RedisRateLimitStorage } from './redis-rate-limit.storage';

@Module({
  imports: [RedisCacheModule],
  providers: [RedisRateLimitStorage],
  exports: [RedisRateLimitStorage],
})
export class RateLimitStorageModule {}

@Module({
  imports: [
    RateLimitStorageModule,
    ThrottlerModule.forRootAsync({
      imports: [RateLimitStorageModule],
      inject: [RedisRateLimitStorage],
      useFactory: (storage: RedisRateLimitStorage) => ({
        throttlers: [GLOBAL_RATE_LIMIT],
        storage,
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiThrottlerGuard,
    },
  ],
  exports: [RateLimitStorageModule, ThrottlerModule],
})
export class RateLimitModule {}
