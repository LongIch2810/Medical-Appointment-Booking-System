import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateArticleDto } from './dto/request/bodyCreateArticle.dto';

import { BodyFilterArticlesDto } from './dto/request/bodyFilterArticles.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';
import { PartialUpdateArticleDto } from './dto/request/partialUpdateArticle.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { MAX_UPLOAD_FILE_SIZE_BYTES, PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Tạo bài viết' })
  @Post('create-article')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @AuditLogAction({ action: 'CREATE', entityName: 'articles' })
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4, fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
    }),
    new FileRequiredInterceptor(),
  )
  async createArticle(
    @Request() req,
    @Body() bodyCreateArticle: BodyCreateArticleDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const { userId } = req.user;

    const message = await this.articlesService.create(
      userId,
      bodyCreateArticle,
      files,
    );
    return message;
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @Patch(':articleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'articles' })
  async updateArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    bodyUpdateArticle: PartialUpdateArticleDto,
  ) {
    const { message } = await this.articlesService.updateArticle(
      articleId,
      bodyUpdateArticle,
    );

    return message;
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Xóa bài viết' })
  @Delete(':articleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'articles' })
  async deleteArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.deleteArticle(articleId);
    return message;
  }

  @ApiOperation({ summary: 'Chi tiết bài viết' })
  @Get(':articleId')
  @HttpCode(HttpStatus.OK)
  async getArticleDetail(@Param('articleId', ParseIntPipe) articleId: number) {
    const article = await this.articlesService.getArticle(articleId);
    return article;
  }

  @ApiCookieAuth()
  @ApiOperation({ summary: 'Duyệt bài viết' })
  @Put(':articleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_APPROVE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'articles.approval' })
  async approveArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.approveArticle(articleId);
    return message;
  }

  @ApiOperation({ summary: 'Danh sách bài viết (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  async getArticles(@Body() objectFilters: BodyFilterArticlesDto) {
    return this.articlesService.filterAndPagination(objectFilters);
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Danh sách bài viết của bác sĩ đang đăng nhập (phân trang, lọc)',
  })
  @Post('my-articles')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_READ)
  async getMyArticles(
    @Request() req,
    @Body() objectFilters: BodyFilterArticlesDto,
  ) {
    const { userId } = req.user;
    // author_id luôn lấy từ user đang đăng nhập, không nhận từ client —
    // tránh 1 bác sĩ tự truyền author_id của bác sĩ khác để xem bài viết
    // không phải của mình.
    return this.articlesService.filterAndPaginationByDoctors({
      ...objectFilters,
      author_id: userId,
    });
  }
}
