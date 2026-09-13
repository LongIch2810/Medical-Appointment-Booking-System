import { forwardRef, Module } from '@nestjs/common';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import Conversation from 'src/entities/conversation.entity';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';
import AiHealthRoadmap from 'src/entities/aiHealthRoadmap.entity';
import AiMedicalRecordSummary from 'src/entities/aiMedicalRecordSummary.entity';
import Relative from 'src/entities/relative.entity';
import { AiDocumentsModule } from '../ai-documents/ai-documents.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([
      Conversation,
      AiHealthRoadmap,
      AiMedicalRecordSummary,
      Relative,
    ]),
    RedisCacheModule,
    forwardRef(() => AiDocumentsModule),
  ],
  controllers: [ChatHistoryController],
  providers: [ChatHistoryService],
  exports: [ChatHistoryService],
})
export class ChatHistoryModule {}
