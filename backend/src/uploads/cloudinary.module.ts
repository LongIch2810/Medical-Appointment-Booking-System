import { Module, forwardRef } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryConfig } from 'src/config/cloudinary/cloudinary.config';
import { UploadsController } from './uploads.controller';
import { BullmqModule } from 'src/bullmq/bullmq.module';
import { MessagesModule } from 'src/modules/messages/messages.module';
import { ArticlesModule } from 'src/modules/articles/articles.module';

@Module({
  imports: [
    forwardRef(() => BullmqModule),
    forwardRef(() => MessagesModule),
    forwardRef(() => ArticlesModule),
  ],
  providers: [CloudinaryService, CloudinaryConfig],
  exports: [CloudinaryService],
  controllers: [UploadsController],
})
export class CloudinaryModule {}
