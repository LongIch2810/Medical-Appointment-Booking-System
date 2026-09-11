import {
  Body,
  Controller,
  forwardRef,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
  Post,
  Request,
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
import { MAX_UPLOAD_FILE_SIZE_BYTES, PERMISSIONS } from 'src/utils/constants';
import { RequestPaylaod } from 'src/shared/types/global.type';
import { CloudinaryService } from './cloudinary.service';
import { mapCloudinaryUploadResults } from './cloudinaryUploadMapper';
import { MessagesService } from 'src/modules/messages/messages.service';
import { ArticlesService } from 'src/modules/articles/articles.service';

@ApiTags('uploads')
@ApiCookieAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadsController {
  constructor(
    @Inject(forwardRef(() => UploadFileProducer))
    private readonly uploadFileProducer: UploadFileProducer,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => ArticlesService))
    private readonly articlesService: ArticlesService,
  ) {}

  @ApiOperation({ summary: 'Tải tệp đính kèm cho tin nhắn' })
  @Post('/messages/files')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(PERMISSIONS.MESSAGE_CREATE)
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4, fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
    }),
    new FileRequiredInterceptor(),
  )
  async uploadFilesMessage(
    @Request() req,
    @Body('message_id', ParseIntPipe) messageId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { userId } = req.user as RequestPaylaod;
    // Ownership trước, upload lên Cloudinary sau — chưa từng chạm Cloudinary
    // nếu người gọi không phải sender của tin nhắn này.
    await this.messagesService.assertMessageSender(userId, messageId);

    const uploaded = await this.cloudinaryService.uploadMultipleFiles(files);
    const filesData = mapCloudinaryUploadResults(uploaded);

    try {
      await this.uploadFileProducer.uploadFilesMessage({
        messageId,
        files: filesData,
      });
    } catch (error) {
      await Promise.all(
        filesData.map((file) =>
          this.cloudinaryService.deleteFile(file.public_id),
        ),
      );
      throw error;
    }

    return { message: 'upload files message' };
  }

  @ApiOperation({ summary: 'Tải tệp đính kèm cho bài viết' })
  @Post('/articles/files')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions(PERMISSIONS.ARTICLE_CREATE)
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4, fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
    }),
    new FileRequiredInterceptor(),
  )
  async uploadFilesArticle(
    @Request() req,
    @Body('article_id', ParseIntPipe) articleId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { userId, roles } = req.user as RequestPaylaod;
    await this.articlesService.assertArticleUploadAccess(
      userId,
      roles,
      articleId,
    );

    const uploaded = await this.cloudinaryService.uploadMultipleFiles(files);
    const filesData = mapCloudinaryUploadResults(uploaded);

    try {
      await this.uploadFileProducer.uploadFilesArticle({
        articleId,
        files: filesData,
      });
    } catch (error) {
      await Promise.all(
        filesData.map((file) =>
          this.cloudinaryService.deleteFile(file.public_id),
        ),
      );
      throw error;
    }

    return { message: 'upload files article' };
  }
}
