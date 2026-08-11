import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Article from 'src/entities/article.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { ArticlesService } from './articles.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let articleRepo: { update: jest.Mock; softDelete: jest.Mock; findOne: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    articleRepo = {
      update: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: articleRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: UploadFileProducer, useValue: { uploadFilesArticle: jest.fn() } },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  describe('filterAndPagination', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { data: 'cached-articles' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'asc',
      } as any);

      expect(result).toBe(cached);
      expect(articleRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries and populates the cache with a 3600s TTL on a cache miss', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      articleRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'asc',
      } as any);

      expect(redisCacheService.setData).toHaveBeenCalledWith(
        expect.stringContaining('articles:public:page=1'),
        expect.anything(),
        3600,
      );
    });
  });

  describe('mutations invalidate the articles cache', () => {
    it('updateArticle wipes the list cache and the article detail key', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1 });
      await service.updateArticle(1, { title: 'New title' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('article:1');
    });

    it('deleteArticle wipes the list cache and the article detail key', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1 });
      await service.deleteArticle(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('article:1');
    });

    it('approveArticle wipes the list cache', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1, is_approve: false });
      await service.approveArticle(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
    });
  });
});
