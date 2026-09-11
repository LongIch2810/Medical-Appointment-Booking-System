import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Article from 'src/entities/article.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { RolePermissionService } from 'src/modules/role-permission/role-permission.service';
import { CloudinaryService } from 'src/uploads/cloudinary.service';
import { PERMISSIONS } from 'src/utils/constants';
import { ArticlesService } from 'src/modules/articles/articles.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let uploadFileProducer: { uploadFilesArticle: jest.Mock };
  let rolePermissionService: { getPermissionsByRoles: jest.Mock };
  let cloudinaryService: { uploadMultipleFiles: jest.Mock; deleteFile: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let articleRepo: {
    update: jest.Mock;
    softDelete: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

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
    uploadFileProducer = { uploadFilesArticle: jest.fn() };
    rolePermissionService = { getPermissionsByRoles: jest.fn() };
    cloudinaryService = {
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: articleRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: UploadFileProducer, useValue: uploadFileProducer },
        { provide: DataSource, useValue: dataSource },
        { provide: RolePermissionService, useValue: rolePermissionService },
        { provide: CloudinaryService, useValue: cloudinaryService },
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

  describe('assertArticleUploadAccess', () => {
    it('rejects when the article does not exist', async () => {
      articleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertArticleUploadAccess(9, ['DOCTOR'], 404),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects a non-author without article:manage attaching a file to someone else's article (IDOR)", async () => {
      articleRepo.findOne.mockResolvedValue({ id: 4, author: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.ARTICLE_CREATE,
      ]);

      await expect(
        service.assertArticleUploadAccess(99, ['PATIENT'], 4),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the real author', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 4, author: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.ARTICLE_CREATE,
      ]);

      await expect(
        service.assertArticleUploadAccess(12, ['DOCTOR'], 4),
      ).resolves.toBeUndefined();
    });

    it('allows a caller holding article:manage regardless of authorship', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 4, author: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.ARTICLE_MANAGE,
      ]);

      await expect(
        service.assertArticleUploadAccess(999, ['ADMIN'], 4),
      ).resolves.toBeUndefined();
    });
  });

  describe('create', () => {
    it('uploads the cover files to Cloudinary and enqueues only the mapped metadata', async () => {
      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ id: 7 }) // author
          .mockResolvedValueOnce({ id: 3 }), // topic
        create: jest.fn((_entity, data) => data),
        save: jest.fn().mockResolvedValue({ id: 55 }),
      };
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
      cloudinaryService.uploadMultipleFiles.mockResolvedValue([
        {
          secure_url: 'https://cdn/cover.png',
          resource_type: 'image',
          original_filename: 'cover',
          bytes: 500,
          format: 'png',
          public_id: 'uploads/cover',
        },
      ]);
      const files = [{ originalname: 'cover.png' }] as Express.Multer.File[];

      await service.create(
        7,
        {
          title: 'Title',
          content: 'x'.repeat(200),
          summary: 'y'.repeat(30),
          tag_ids: [],
          topic_id: 3,
        } as never,
        files,
      );

      expect(cloudinaryService.uploadMultipleFiles).toHaveBeenCalledWith(files);
      expect(uploadFileProducer.uploadFilesArticle).toHaveBeenCalledWith({
        articleId: 55,
        files: [
          {
            url: 'https://cdn/cover.png',
            type: 'IMAGE',
            file_name: 'cover',
            file_size: 500,
            file_extension: 'png',
            public_id: 'uploads/cover',
          },
        ],
      });
    });
  });
});
