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

@Controller('articles')
@UseGuards(JwtAuthGuard)
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);
  constructor(private readonly articlesService: ArticlesService) {}

  @Post('create-article')
  @HttpCode(HttpStatus.CREATED)
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
  async deleteArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.deleteArticle(articleId);
    return message;
  }

  @Get(':articleId')
  async getArticleDetail(@Param('articleId', ParseIntPipe) articleId: number) {
    const article = await this.articlesService.getArticle(articleId);
    return article;
  }

  @Put(':articleId')
  async approveArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    const { message } = await this.articlesService.approveArticle(articleId);
    return message;
  }

  @Post()
  async getArticles(@Body() objectFilters: BodyFilterArticlesDto) {
    return this.articlesService.filterAndPagination(objectFilters);
  }
}
