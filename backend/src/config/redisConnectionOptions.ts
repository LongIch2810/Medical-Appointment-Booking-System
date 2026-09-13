import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

const DEFAULT_REDIS_PORT = 6379;

function parseNonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePort(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535
    ? parsed
    : DEFAULT_REDIS_PORT;
}

function decodeUrlPart(value: string): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getRedisConnectionOptions(
  configService: ConfigService,
  databaseEnvKey: string,
): RedisOptions {
  const redisUrl = configService.get<string>('REDIS_URL')?.trim();

  if (redisUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redisUrl);
    } catch {
      throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
    }

    if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
      throw new Error('REDIS_URL must use the redis:// or rediss:// protocol.');
    }

    const databaseFromUrl = parsedUrl.pathname.replace(/^\//, '');
    const database = parseNonNegativeInteger(
      configService.get<string>(databaseEnvKey),
      parseNonNegativeInteger(databaseFromUrl, 0),
    );

    return {
      host: parsedUrl.hostname,
      port: parsePort(parsedUrl.port),
      username: decodeUrlPart(parsedUrl.username),
      password: decodeUrlPart(parsedUrl.password),
      tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
      db: database,
    };
  }

  return {
    host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
    port: parsePort(configService.get<string>('REDIS_PORT')),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    tls: configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
    db: parseNonNegativeInteger(configService.get<string>(databaseEnvKey), 0),
  };
}
