import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsRateLimitException } from './ws-rate-limit.exception';

@Catch(WsRateLimitException)
export class WsRateLimitFilter implements ExceptionFilter<WsRateLimitException> {
  catch(exception: WsRateLimitException, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    client.emit('ws-error', exception.payload);
  }
}
