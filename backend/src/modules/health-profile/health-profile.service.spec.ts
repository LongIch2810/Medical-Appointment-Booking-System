import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import HealthProfile from 'src/entities/healthProfile.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RelativesService } from '../relatives/relatives.service';
import { UsersService } from '../users/users.service';
import { HealthProfileService } from './health-profile.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

describe('HealthProfileService', () => {
  let service: HealthProfileService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let healthProfileRepo: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let relativesService: { findOwnedByUserId: jest.Mock };
  let usersService: { isUserExists: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    healthProfileRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => makeQb()),
    };

    relativesService = { findOwnedByUserId: jest.fn() };
    usersService = { isUserExists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthProfileService,
        {
          provide: getRepositoryToken(HealthProfile),
          useValue: healthProfileRepo,
        },
        { provide: RelativesService, useValue: relativesService },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<HealthProfileService>(HealthProfileService);
  });

  describe('getHealthProfile', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      relativesService.findOwnedByUserId.mockResolvedValue({ id: 2 });
      const cached = { id: 5 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getHealthProfile(9, 2);

      expect(result).toBe(cached);
      expect(healthProfileRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it("wipes the health-profiles list cache and this relative's detail key", async () => {
      relativesService.findOwnedByUserId.mockResolvedValue({
        id: 2,
        health_profile: { id: 5 },
      });
      healthProfileRepo.save.mockResolvedValue({ id: 5 });

      await service.update(9, 2, {} as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'healthProfiles:',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'healthProfile:relative:2',
      );
    });
  });
});
