import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { MessagesModule } from 'src/modules/messages/messages.module';
import { WsCookieAuthGuard } from 'src/common/guards/wsCookieAuth.guard';
import { RateLimitModule } from 'src/common/rate-limit/rate-limit.module';
import { SessionAuthModule } from 'src/modules/auth/session-auth.module';
import { WebsocketConnectionRateLimitService } from './websocket-connection-rate-limit.service';
import { WsRateLimitFilter } from './ws-rate-limit.filter';
import { WsRateLimitGuard } from './ws-rate-limit.guard';
import { WEBSOCKET_GATEWAY } from './websocket-gateway.token';

@Module({
  imports: [MessagesModule, RateLimitModule, SessionAuthModule],
  providers: [
    WebsocketGateway,
    WsCookieAuthGuard,
    WsRateLimitGuard,
    WsRateLimitFilter,
    WebsocketConnectionRateLimitService,
    { provide: WEBSOCKET_GATEWAY, useExisting: WebsocketGateway },
  ],
  exports: [WebsocketGateway, WEBSOCKET_GATEWAY],
})
export class WebsocketModule {}
