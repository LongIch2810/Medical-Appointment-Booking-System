import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Appointment from 'src/entities/appointment.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { UsersService } from '../users/users.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { RelativesService } from '../relatives/relatives.service';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { AppointmentsService } from './appointments.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let appointmentRepo: { createQueryBuilder: jest.Mock; update: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    appointmentRepo = {
      createQueryBuilder: jest.fn(() => makeQb()),
      update: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: UsersService, useValue: { findByUserId: jest.fn(), isUserExists: jest.fn().mockResolvedValue(true) } },
        { provide: DoctorSchedulesService, useValue: {} },
        { provide: RelativesService, useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: WebsocketGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('getAppointmentDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getAppointmentDetail(9, 1);

      expect(result).toBe(cached);
      expect(appointmentRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('wipes the appointments list cache and this appointment detail key', async () => {
      jest.spyOn(service, 'isAppointmentExistAndPending').mockResolvedValue(true as any);
      jest.spyOn(service, 'getAppointmentDetail').mockResolvedValue({ id: 3 } as any);

      await service.cancel(9, 3);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('appointments:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('user:9:appointment:3');
    });
  });

  describe('updateStatus', () => {
    it('wipes the appointments list cache and the booking user detail key', async () => {
      const mockAppointment = {
        id: 3,
        status: AppointmentStatus.CONFIRMED,
        booked_by_user: { id: 9 },
        doctor_schedule: {
          start_time: '00:00:00',
          end_time: '01:00:00',
          day_of_week: 'MON',
          is_active: true,
          doctor: { user: {}, specialty: {} },
        },
        appointment_date: new Date(0),
        booking_mode: 'USER_SELECT',
        patient: {},
        examination_result: null,
        satisfaction_rating: null,
        created_at: new Date(0),
        updated_at: new Date(0),
      };

      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest
            .fn()
            .mockResolvedValueOnce(mockAppointment)
            .mockResolvedValueOnce({ ...mockAppointment, status: AppointmentStatus.ABSENT }),
        }),
      );

      await service.updateStatus(3, AppointmentStatus.ABSENT);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('appointments:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('user:9:appointment:3');
    });
  });
});
