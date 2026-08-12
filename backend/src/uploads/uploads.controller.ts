import {
  Body,
  Controller,
  forwardRef,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@ApiTags('uploads')
@ApiCookieAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadsController {
  constructor(
    @Inject(forwardRef(() => UploadFileProducer))
    private readonly uploadFileProducer: UploadFileProducer,
  ) {}

  @ApiOperation({ summary: 'Tải tệp đính kèm cho tin nhắn' })
  @Post('/messages/files')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(PERMISSIONS.MESSAGE_CREATE)
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

  @ApiOperation({ summary: 'Tải tệp đính kèm cho bài viết' })
  @Post('/articles/files')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(PERMISSIONS.ARTICLE_CREATE)
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
