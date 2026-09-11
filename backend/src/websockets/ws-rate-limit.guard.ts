import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Socket } from 'socket.io';
import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_MESSAGE,
} from 'src/common/rate-limit/rate-limit.constants';
import { WsRateLimitException } from './ws-rate-limit.exception';

@Injectable()
export class WsRateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(context.getType() !== 'ws');
  }

  protected async handleRequest({
    context,
    limit,
    ttl,
    throttler,
    blockDuration,
    generateKey,
  }: ThrottlerRequest): Promise<boolean> {
    const ws = context.switchToWs();
    const client = ws.getClient<Socket>();
    const data = ws.getData<{ id?: unknown } | undefined>();
    const connectionReady = client.data?.connectionReady;
    if (
      connectionReady &&
      typeof (connectionReady as Promise<unknown>).then === 'function'
    ) {
      await connectionReady;
    }

    const userId = Number(client.data?.user?.sub);
    const tracker =
      Number.isInteger(userId) && userId > 0
        ? `user:${userId}`
        : `socket:${client.id}`;
    const key = generateKey(context, tracker, throttler.name ?? 'default');
    const result = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttler.name ?? 'default',
    );

    if (!result.isBlocked) {
      return true;
    }

    const eventId =
      typeof data?.id === 'number' && Number.isFinite(data.id)
        ? data.id
        : undefined;
    throw new WsRateLimitException({
      code: 429,
      errorCode: RATE_LIMIT_ERROR_CODE,
      message: RATE_LIMIT_ERROR_MESSAGE,
      event: ws.getPattern(),
      ...(eventId !== undefined ? { eventId } : {}),
      retryAfter: result.timeToBlockExpire,
    });
  }
}
