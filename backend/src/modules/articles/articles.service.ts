import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Article from 'src/entities/article.entity';
import { DataSource, In, Repository } from 'typeorm';
import { BodyCreateArticleDto } from './dto/request/bodyCreateArticle.dto';
import User from 'src/entities/user.entity';
import { BodyUpdateArticleDto } from './dto/request/bodyUpdateArticle.dto';
import { generateSlug } from 'src/utils/generateSlug';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { removePasswordDeep } from 'src/utils/removePasswordDeep';

import { BodyFilterArticlesDto } from './dto/request/bodyFilterArticles.dto';
import Topic from 'src/entities/topic.entity';
import ArticleTag from 'src/entities/articleTag.entity';
import Tag from 'src/entities/tag.entity';
import { UploadFileResponse } from 'src/shared/interfaces/uploadFileResponse';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { PartialUpdateArticleDto } from './dto/request/partialUpdateArticle.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { ArticleResponseDto } from './dto/response/articleResponse.dto';
import { ArticleMapper } from './article.mapper';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    private readonly redisCacheService: RedisCacheService,
    @Inject(forwardRef(() => UploadFileProducer))
    private readonly uploadFileProducer: UploadFileProducer,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: number,
    bodyCreateArticle: BodyCreateArticleDto,
    files: Express.Multer.File[],
  ) {
    const newArticle = await this.dataSource.transaction(async (manager) => {
      const author = await manager.findOne(User, { where: { id: userId } });
      if (!author) throw new NotFoundException('Người dùng không tồn tại.');
      const topic = await manager.findOne(Topic, {
        where: { id: bodyCreateArticle.topic_id },
      });
      if (!topic) throw new NotFoundException('Chủ đề không tồn tại.');
      const articleData = {
        ...bodyCreateArticle,
        slug: generateSlug(bodyCreateArticle.title + Date.now()),
        author,
        topic,
      };
      const createdArticle = manager.create(Article, articleData);
      const newArticle = await manager.save(Article, createdArticle);
      const tag_ids = bodyCreateArticle.tag_ids;
      if (tag_ids && tag_ids.length > 0) {
        const tags = await manager.find(Tag, { where: { id: In(tag_ids) } });
        if (tags.length !== tag_ids.length)
          throw new NotFoundException('Một hoặc nhiều tag không tồn tại.');
        const articleTags = tag_ids.map((tagId) =>
          manager.create(ArticleTag, {
            article: newArticle,
            tag: { id: tagId },
          }),
        );
        await manager.save(ArticleTag, articleTags);
      }
      return newArticle;
    });

    await this.uploadFileProducer.uploadFilesArticle({
      articleId: newArticle.id,
      files,
    });

    return ArticleMapper.toArticleResponseDto(newArticle);
  }

  async updateArticle(
    articleId: number,
    bodyUpdateArticle: PartialUpdateArticleDto,
  ) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId, is_approve: true },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    const fields: Partial<BodyUpdateArticleDto> & { slug?: string } = {
      ...bodyUpdateArticle,
      ...(bodyUpdateArticle?.title && {
        slug: generateSlug(bodyUpdateArticle.title + Date.now()),
      }),
    };

    await this.articleRepo.update(articleId, fields);

    await this.redisCacheService.delData(`article:${articleId}`);

    return { message: 'Cập nhật bài viết thành công' };
  }

  async deleteArticle(articleId: number) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId, is_approve: true },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    await this.articleRepo.softDelete(articleId);

    await this.redisCacheService.delData(`article:${articleId}`);

    return { message: 'Xóa bài biết thành công.' };
  }

  async getArticle(articleId: number) {
    const cacheKey = `article:${articleId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const article = await this.articleRepo.findOne({
      where: { id: articleId, is_approve: true },
      relations: ['author', 'tags', 'tags.tag', 'topic'],
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    await this.redisCacheService.setData(
      cacheKey,
      ArticleMapper.toArticleResponseDto(article),
      3600,
    );

    return ArticleMapper.toArticleResponseDto(article);
  }

  async approveArticle(articleId: number) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }

    if (article.is_approve) {
      throw new BadRequestException('Bài viết đã được phê duyệt.');
    }

    await this.articleRepo.update(articleId, { is_approve: true });

    return { message: 'Duyệt bài viết thành công.' };
  }

  async filterAndPagination(objectFilters: BodyFilterArticlesDto) {
    let { page, limit, arrange, search, topic_slug } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `articles:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.topic', 'topic')
      .leftJoinAndSelect('article.tags', 'articleTag')
      .leftJoinAndSelect('articleTag.tag', 'tag')
      .where('article.is_approve = :is_approve', { is_approve: true })
      .andWhere('article.deleted_at IS NULL')
      .orderBy('article.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .take(limit)
      .skip(skip);

    const filters = [
      {
        condition: 'topic.slug = :topic_slug',
        value: topic_slug,
        key: 'topic_slug',
      },
      {
        condition: `(LOWER(article.title) LIKE LOWER(:search) 
      OR LOWER(author.fullname) LIKE LOWER(:search) 
      OR LOWER(topic.name) LIKE LOWER(:search) 
      OR LOWER(tag.name) LIKE LOWER(:search))`,
        value: search,
        key: 'search',
      },
    ];

    filters.forEach(({ condition, value, key }) => {
      if (value !== undefined && value !== null) {
        query.andWhere(condition, { [key]: value });
      }
    });

    const [articles, total] = await query.getManyAndCount();

    const result = new PaginationResultDto<ArticleResponseDto>(
      'articles',
      ArticleMapper.toArticleResponseDtoList(articles),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  //check xem bài viết tồn tại chưa (đã duyệt và chưa duyệt)
  async isArticleExists(articleId: number) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
      relations: ['author'],
    });

    return !!article;
  }

  async;

  async updateFilesArticle(articleId: number, files: UploadFileResponse[]) {
    const article = await this.articleRepo.findOne({
      where: { id: articleId },
      relations: ['author'],
    });
    if (!article) {
      throw new NotFoundException('Bài viết không tồn tại.');
    }
    const urls = files.map((file) => ({
      url: file.url,
      public_id: file.public_id,
    }));
    await this.articleRepo.update(article.id, { img_urls: urls });
    article.img_urls = urls;
    return article;
  }
}
