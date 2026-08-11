import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
  private client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async setData<T>(key: string, value: T, ttl?: number): Promise<void> {
    const parseValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    ttl && ttl > 0
      ? await this.client.set(key, parseValue, 'EX', ttl)
      : await this.client.set(key, parseValue);
  }

  async getData<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delData(key: string): Promise<void> {
    if (await this.client.exists(key)) {
      await this.client.del(key);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this.client.scanStream({ match: `${prefix}*` });
      const pipeline = this.client.pipeline();
      let hasKeys = false;

      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          hasKeys = true;
          keys.forEach((key) => pipeline.del(key));
        }
      });

      stream.on('end', () => {
        if (hasKeys) {
          pipeline.exec().then(() => resolve()).catch(reject);
        } else {
          resolve();
        }
      });

      stream.on('error', reject);
    });
  }

  async lRange(
    key: string,
    startIndex: number,
    endIndex: number,
  ): Promise<string[]> {
    return this.client.lrange(key, startIndex, endIndex);
  }

  async rPush(key: string, value: string): Promise<number> {
    return this.client.rpush(key, value);
  }

  async lPop(key: string): Promise<string | null> {
    return (await this.client.exists(key)) ? this.client.lpop(key) : null;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  lRem(key: string, count: number, value: string): Promise<number> {
    return this.client.lrem(key, count, value);
  }
}
