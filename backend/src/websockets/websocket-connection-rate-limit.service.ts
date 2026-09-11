import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { isIP } from 'net';
import { Socket } from 'socket.io';
import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_MESSAGE,
  WEBSOCKET_RATE_LIMIT_POLICIES,
} from 'src/common/rate-limit/rate-limit.constants';
import { RedisRateLimitStorage } from 'src/common/rate-limit/redis-rate-limit.storage';
import { parseTrustProxyHops } from 'src/common/rate-limit/trust-proxy';
import { WsRateLimitErrorPayload } from './ws-rate-limit.types';

@Injectable()
export class WebsocketConnectionRateLimitService {
  constructor(
    private readonly storage: RedisRateLimitStorage,
    private readonly configService: ConfigService,
  ) {}

  async consume(
    client: Socket,
  ): Promise<
    { allowed: true } | { allowed: false; error: WsRateLimitErrorPayload }
  > {
    const tracker = this.hashTracker(this.getClientIp(client));
    const policy = WEBSOCKET_RATE_LIMIT_POLICIES.connection;
    const result = await this.storage.increment(
      tracker,
      policy.ttl,
      policy.limit,
      policy.blockDuration,
      'ws-connection',
    );

    if (!result.isBlocked) {
      return { allowed: true };
    }

    return {
      allowed: false,
      error: {
        code: 429,
        errorCode: RATE_LIMIT_ERROR_CODE,
        message: RATE_LIMIT_ERROR_MESSAGE,
        retryAfter: result.timeToBlockExpire,
      },
    };
  }

  private getClientIp(client: Socket): string {
    const remoteAddress =
      client.conn?.remoteAddress || client.handshake?.address || 'unknown';
    const trustedHops = parseTrustProxyHops(
      this.configService.get<string>('TRUST_PROXY_HOPS'),
    );

    if (trustedHops === 0) {
      return remoteAddress;
    }

    const forwardedHeader = client.handshake?.headers?.['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwardedHeader)
      ? forwardedHeader[0]
      : forwardedHeader;
    const forwardedAddresses = (forwardedValue ?? '')
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean);
    const chain = [...forwardedAddresses, remoteAddress];
    const clientIndex = Math.max(0, chain.length - trustedHops - 1);
    const candidate = chain[clientIndex];

    return candidate && isIP(candidate) !== 0 ? candidate : remoteAddress;
  }

  private hashTracker(ip: string): string {
    return createHash('sha256')
      .update(`websocket:connection:${ip}`)
      .digest('hex');
  }
}
