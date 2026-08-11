import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { DoctorsService } from '../doctors/doctors.service';
import { DoctorSchedulesService } from './doctor-schedules.service';

describe('DoctorSchedulesService', () => {
  let service: DoctorSchedulesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let doctorScheduleRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let doctorsService: {
    findDoctorByUserId: jest.Mock;
    findByDoctorId: jest.Mock;
  };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    doctorScheduleRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };

    doctorsService = {
      findDoctorByUserId: jest.fn().mockResolvedValue({ id: 4 }),
      findByDoctorId: jest.fn().mockResolvedValue({ id: 4 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorSchedulesService,
        {
          provide: getRepositoryToken(DoctorSchedule),
          useValue: doctorScheduleRepo,
        },
        { provide: DoctorsService, useValue: doctorsService },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<DoctorSchedulesService>(DoctorSchedulesService);
  });

  describe('getDoctorScheduleDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 7 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getDoctorScheduleDetail(7);

      expect(result).toBe(cached);
      expect(doctorScheduleRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it("wipes the schedule detail key and this doctor's schedule-list key", async () => {
      doctorScheduleRepo.findOne.mockResolvedValue({
        id: 7,
        doctor: { id: 4 },
      });

      await service.remove(1, 7);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'doctorSchedule:7',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'doctorSchedules:doctor:4',
      );
    });
  });
});
