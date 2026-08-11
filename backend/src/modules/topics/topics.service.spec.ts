import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Topic from 'src/entities/topic.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { TopicsService } from './topics.service';

describe('TopicsService', () => {
  let service: TopicsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let topicRepo: {
    create: jest.Mock;
    save: jest.Mock;
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

    topicRepo = {
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: getRepositoryToken(Topic), useValue: topicRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  describe('filterAndPagination', () => {
    it('sets the list cache with a 3600s TTL', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      topicRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({ page: 1, limit: 10, arrange: 'asc' } as any);

      expect(redisCacheService.setData).toHaveBeenCalledWith(
        expect.stringContaining('topics:page=1'),
        expect.anything(),
        3600,
      );
    });
  });

  describe('mutations invalidate the topics cache', () => {
    it('create wipes the list cache', async () => {
      topicRepo.findOne.mockResolvedValue(null);
      topicRepo.create.mockReturnValue({});
      topicRepo.save.mockResolvedValue({ id: 1, name: 'X', description: 'd', slug: 'x' });

      await service.create({ name: 'X', description: 'd' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
    });

    it('update wipes the list cache and the topic detail key', async () => {
      topicRepo.findOne.mockResolvedValue({ id: 1, name: 'Old', description: 'd' });
      topicRepo.save.mockResolvedValue({ id: 1, name: 'Old', description: 'd' });

      await service.update(1, { description: 'new' });

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('topic:1');
    });

    it('remove wipes the list cache and the topic detail key', async () => {
      topicRepo.findOne.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('topic:1');
    });
  });

  describe('getTopic', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1, name: 'Cached' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getTopic(1);

      expect(result).toBe(cached);
      expect(topicRepo.findOne).not.toHaveBeenCalled();
    });
  });
});
