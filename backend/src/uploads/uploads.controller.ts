import {
  Body,
  Controller,
  forwardRef,
  Inject,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    @Inject(forwardRef(() => UploadFileProducer))
    private readonly uploadFileProducer: UploadFileProducer,
  ) {}

  @Post('/messages/files')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4 },
    }),
    new FileRequiredInterceptor(),
  )
  async uploadFilesMessage(
    @Body('message_id', ParseIntPipe) messageId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('>>> files', files);
    await this.uploadFileProducer.uploadFilesMessage({ messageId, files });
    return { message: 'upload files message' };
  }

  @Post('/articles/files')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4 },
    }),
    new FileRequiredInterceptor(),
  )
  async uploadFilesArticle(
    @Body('article_id', ParseIntPipe) articleId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('>>> files', files);
    await this.uploadFileProducer.uploadFilesArticle({ articleId, files });
    return { message: 'upload files article' };
  }
}
