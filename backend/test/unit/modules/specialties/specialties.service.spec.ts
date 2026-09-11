import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { SpecialtiesService } from 'src/modules/specialties/specialties.service';

describe('SpecialtiesService', () => {
  let service: SpecialtiesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let specialtyRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    specialtyRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialtiesService,
        { provide: getRepositoryToken(Specialty), useValue: specialtyRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<SpecialtiesService>(SpecialtiesService);
  });

  describe('getSpecialtyDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1, name: 'Cached' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getSpecialtyDetail(1);

      expect(result).toBe(cached);
      expect(specialtyRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('wipes the list cache and the specialty detail key', async () => {
      specialtyRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'Old',
        description: 'd',
        img_url: 'x',
      });
      specialtyRepo.save.mockResolvedValue({ id: 1, name: 'Old' });

      await service.update(1, { description: 'new' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'specialties:',
      );
      expect(redisCacheService.delData).toHaveBeenCalledWith('specialty:1');
    });
  });

  describe('delete', () => {
    it('wipes the list cache and the specialty detail key', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      specialtyRepo.findOne.mockResolvedValue({
        id: 1,
        name: 'X',
        description: 'd',
        img_url: 'x',
      });

      await service.delete(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'specialties:',
      );
      expect(redisCacheService.delData).toHaveBeenCalledWith('specialty:1');
    });
  });

  describe('filterAndPagination', () => {
    it('ANDs the search clause with deleted_at IS NULL and matches by substring (wildcarded)', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[{ id: 1, name: 'Da liễu' }], 1]),
      };
      specialtyRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({
        page: 1,
        limit: 10,
        search: 'da',
        arrange: 'desc',
      } as any);

      expect(qb.where).toHaveBeenCalledWith('specialty.deleted_at is NULL');
      expect(qb.andWhere).toHaveBeenCalledWith(
        'UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:search))',
        { search: '%da%' },
      );
    });

    it('does not apply the search clause when no search term is given', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      specialtyRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'desc',
      } as any);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });
});
