import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Notification from 'src/entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import User from 'src/entities/user.entity';
import { WebsocketModule } from 'src/websockets/websoket.module';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    WebsocketModule,
    RedisCacheModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
