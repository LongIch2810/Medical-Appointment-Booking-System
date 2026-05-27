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
import { PERMISSIONS } from 'src/utils/constants';

@Controller('articles')
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);
  constructor(private readonly articlesService: ArticlesService) {}

  @Post('create-article')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @AuditLogAction({ action: 'CREATE', entityName: 'articles' })
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      limits: { files: 4 },
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

  @Delete(':articleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'articles' })
  async deleteArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.deleteArticle(articleId);
    return message;
  }

  @Get(':articleId')
  @HttpCode(HttpStatus.OK)
  async getArticleDetail(@Param('articleId', ParseIntPipe) articleId: number) {
    const article = await this.articlesService.getArticle(articleId);
    return article;
  }

  @Put(':articleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.ARTICLE_APPROVE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'articles.approval' })
  async approveArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.approveArticle(articleId);
    return message;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async getArticles(@Body() objectFilters: BodyFilterArticlesDto) {
    return this.articlesService.filterAndPagination(objectFilters);
  }
}
