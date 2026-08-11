import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Doctor from 'src/entities/doctor.entity';
import User from 'src/entities/user.entity';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { DoctorsService } from './doctors.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    subQuery: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    getCount: jest.fn().mockResolvedValue(0),
    getQuery: jest.fn().mockReturnValue(''),
    groupBy: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

describe('DoctorsService', () => {
  let service: DoctorsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let doctorRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; softDelete: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    doctorRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(() => makeQb()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: getRepositoryToken(Doctor), useValue: doctorRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Specialty), useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  describe('getDoctorDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getDoctorDetail(1);

      expect(result).toBe(cached);
      expect(doctorRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('wipes the doctors list/outstanding cache and the doctor detail key', async () => {
      redisCacheService.getData.mockResolvedValue({ id: 5 });

      await service.remove(5);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctors:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('doctor:5');
    });
  });
});
