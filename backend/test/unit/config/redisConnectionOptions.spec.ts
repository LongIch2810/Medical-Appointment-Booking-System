import { ConfigService } from '@nestjs/config';
import { getRedisConnectionOptions } from 'src/config/redisConnectionOptions';

function createConfig(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('getRedisConnectionOptions', () => {
  it('uses a Render redis:// internal URL without TLS', () => {
    const options = getRedisConnectionOptions(
      createConfig({
        REDIS_URL: 'redis://red-example:6379',
        REDIS_TLS: 'true',
      }),
      'REDIS_CACHE_DB',
    );

    expect(options).toMatchObject({
      host: 'red-example',
      port: 6379,
      db: 0,
    });
    expect(options.tls).toBeUndefined();
  });

  it('parses credentials, TLS, and database from a rediss:// URL', () => {
    const options = getRedisConnectionOptions(
      createConfig({
        REDIS_URL: 'rediss://user:p%40ss@redis.example.com:6380/2',
      }),
      'REDIS_CACHE_DB',
    );

    expect(options).toMatchObject({
      host: 'redis.example.com',
      port: 6380,
      username: 'user',
      password: 'p@ss',
      db: 2,
      tls: {},
    });
  });

  it('keeps HOST/PORT configuration as a local fallback', () => {
    const options = getRedisConnectionOptions(
      createConfig({
        REDIS_HOST: 'redis',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: 'secret',
        REDIS_TLS: 'false',
        REDIS_BULLMQ_DB: '1',
      }),
      'REDIS_BULLMQ_DB',
    );

    expect(options).toMatchObject({
      host: 'redis',
      port: 6379,
      password: 'secret',
      db: 1,
    });
    expect(options.tls).toBeUndefined();
  });

  it('rejects non-Redis URLs at startup', () => {
    expect(() =>
      getRedisConnectionOptions(
        createConfig({ REDIS_URL: 'https://redis.example.com' }),
        'REDIS_CACHE_DB',
      ),
    ).toThrow(/redis:\/\/ or rediss:\/\//);
  });
});
