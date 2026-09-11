import { Injectable } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { FailOpenThrottlerStorage } from './fail-open-throttler-storage';

@Injectable()
export class RedisRateLimitStorage extends FailOpenThrottlerStorage {
  constructor(redisCacheService: RedisCacheService) {
    super(new ThrottlerStorageRedisService(redisCacheService.getClient()));
  }
}
