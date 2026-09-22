import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/uploads/cloudinary.module';
import { AiDocumentStorageService } from './ai-document-storage.service';
import { forwardRef } from '@nestjs/common';
import { ChatHistoryModule } from '../chat-history/chat-history.module';

@Module({
  imports: [CloudinaryModule, forwardRef(() => ChatHistoryModule)],
  controllers: [],
  providers: [AiDocumentStorageService],
  exports: [AiDocumentStorageService],
})
export class AiDocumentsModule {}
