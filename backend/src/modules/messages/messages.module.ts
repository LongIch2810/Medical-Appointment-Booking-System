import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Message from 'src/entities/message.entity';
import Channel from 'src/entities/channel.entity';
import MessageAttachments from 'src/entities/messageAttachments.entity';
import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Channel, MessageAttachments]),
    ChannelsModule,
    UsersModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
