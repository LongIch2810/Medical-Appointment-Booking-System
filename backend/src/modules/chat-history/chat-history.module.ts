import { forwardRef, Module } from '@nestjs/common';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Conversation from 'src/entities/conversation.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import PatientChatConversation from 'src/entities/patientChatConversation.entity';
import PatientChatMessage from 'src/entities/patientChatMessage.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([
      Conversation,
      PatientChatConversation,
      PatientChatMessage,
    ]),
    RedisCacheModule,
  ],
  controllers: [ChatHistoryController],
  providers: [ChatHistoryService],
  exports: [ChatHistoryService],
})
export class ChatHistoryModule {}
