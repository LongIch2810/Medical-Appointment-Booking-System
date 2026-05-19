import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { MessagesModule } from 'src/modules/messages/messages.module';
import { JwtModule } from '@nestjs/jwt';
import { WsCookieAuthGuard } from 'src/common/guards/wsCookieAuth.guard';
@Module({
  imports: [
    MessagesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [WebsocketGateway, WsCookieAuthGuard],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
