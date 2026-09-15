/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import Appointment from 'src/entities/appointment.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { UsersService } from 'src/modules/users/users.service';
import { DoctorSchedulesService } from 'src/modules/doctor-schedules/doctor-schedules.service';
import { RelativesService } from 'src/modules/relatives/relatives.service';
import { SpecialtiesService } from 'src/modules/specialties/specialties.service';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { dayNumberToEnum } from 'src/shared/enums/dayOfWeek';
import { BookingMode } from 'src/shared/enums/bookingMode';
import {
  APPOINTMENT_SLOT_UNAVAILABLE,
  AppointmentsService,
} from 'src/modules/appointments/appointments.service';
import { BodyCreateAppointmentDto } from 'src/modules/appointments/dto/request/bodyCreateAppointment.dto';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { NotificationType } from 'src/shared/enums/notificationType';
import { SettingsService } from 'src/modules/settings/settings.service';
import { EmailProducer } from 'src/bullmq/queues/email/email.producer';
import { RoleName } from 'src/shared/enums/roleName';

function makeManagerQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    setLock: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeMockManager(
  options: {
    relativeQb?: any;
    doctorScheduleQb?: any;
    appointmentQb?: any;
    findOneResult?: any;
  } = {},
) {
  const relativeQb = options.relativeQb ?? makeManagerQb();
  const doctorScheduleQb = options.doctorScheduleQb ?? makeManagerQb();
  const appointmentQb = options.appointmentQb ?? makeManagerQb();

  return {
    findOne: jest.fn().mockResolvedValue(options.findOneResult ?? null),
    create: jest.fn((_entity: any, data: any) => data),
    save: jest.fn((_entity: any, data: any) =>
      Promise.resolve({ id: 100, ...data }),
    ),
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name ?? entity;
      if (name === 'Relative') {
        return { createQueryBuilder: jest.fn(() => relativeQb) };
      }
      if (name === 'DoctorSchedule') {
        return { createQueryBuilder: jest.fn(() => doctorScheduleQb) };
      }
      if (name === 'Appointment') {
        return { createQueryBuilder: jest.fn(() => appointmentQb) };
      }
      return { createQueryBuilder: jest.fn(() => makeManagerQb()) };
    }),
  };
}

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let appointmentRepo: {
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
    save: jest.Mock;
  };
  let usersService: { findByUserId: jest.Mock; isUserExists: jest.Mock };
  let specialtiesService: { findSpecialtyById: jest.Mock };
  let dataSource: { transaction: jest.Mock; createQueryBuilder: jest.Mock };
  let gateway: {
    notifyBookAppointmentSuccess: jest.Mock;
    notifyBookAppointmentFail: jest.Mock;
  };
  let relativesService: { findOrCreateForBooking: jest.Mock };
  let notificationsService: {
    createAppointmentNotifications: jest.Mock;
    createAppointmentReminder: jest.Mock;
  };
  let settingsService: {
    shouldSendAppointmentEmail: jest.Mock;
    shouldSendAppointmentReminder: jest.Mock;
    getAppointmentReminderBeforeMinutes: jest.Mock;
  };
  let emailProducer: { sendAppointment: jest.Mock };

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

    usersService = {
      findByUserId: jest.fn(),
      isUserExists: jest.fn().mockResolvedValue(true),
    };

    specialtiesService = {
      findSpecialtyById: jest
        .fn()
        .mockResolvedValue({ id: 1, name: 'Nội tổng quát' }),
    };

    dataSource = {
      transaction: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    gateway = {
      notifyBookAppointmentSuccess: jest.fn(),
      notifyBookAppointmentFail: jest.fn(),
    };

    relativesService = {
      findOrCreateForBooking: jest.fn(),
    };
    notificationsService = {
      createAppointmentNotifications: jest.fn().mockResolvedValue([]),
      createAppointmentReminder: jest.fn(),
    };
    settingsService = {
      shouldSendAppointmentEmail: jest.fn().mockResolvedValue(false),
      shouldSendAppointmentReminder: jest.fn().mockResolvedValue(true),
      getAppointmentReminderBeforeMinutes: jest.fn().mockResolvedValue(1440),
    };
    emailProducer = { sendAppointment: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: UsersService, useValue: usersService },
        { provide: DoctorSchedulesService, useValue: {} },
        { provide: RelativesService, useValue: relativesService },
        { provide: SpecialtiesService, useValue: specialtiesService },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: DataSource, useValue: dataSource },
        { provide: WebsocketGateway, useValue: gateway },
        { provide: NotificationsService, useValue: notificationsService },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
        {
          provide: EmailProducer,
          useValue: emailProducer,
        },
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

    const detailAppointmentStub = {
      id: 1,
      status: AppointmentStatus.PENDING,
      doctor_schedule: { doctor: {}, start_time: '08:00', end_time: '09:00' },
      patient: {},
      examination_result: null,
      satisfaction_rating: null,
    };

    it('scopes a patient actor to appointments they booked (bookedByUser)', async () => {
      const qb = makeQb({
        getOne: jest.fn().mockResolvedValue(detailAppointmentStub),
      });
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getAppointmentDetail(9, 1, ['PATIENT']);

      expect(qb.andWhere).toHaveBeenCalledWith('bookedByUser.id = :userId', {
        userId: 9,
      });
    });

    it('scopes a doctor actor to appointments they are assigned to (doctorUser), not the booker', async () => {
      const qb = makeQb({
        getOne: jest.fn().mockResolvedValue(detailAppointmentStub),
      });
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getAppointmentDetail(20, 1, ['DOCTOR']);

      expect(qb.andWhere).toHaveBeenCalledWith('doctorUser.id = :userId', {
        userId: 20,
      });
      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'bookedByUser.id = :userId',
        expect.anything(),
      );
    });

    it('does not scope an admin actor to any particular user', async () => {
      const qb = makeQb({
        getOne: jest.fn().mockResolvedValue(detailAppointmentStub),
      });
      appointmentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getAppointmentDetail(1, 1, ['ADMIN']);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('getAppoitnmentToDayEarlyOfDoctor', () => {
    it('returns null instead of throwing when the doctor has no appointment scheduled today', async () => {
      // Regression test: the doctor dashboard (GET /dashboard/doctor) calls this
      // to populate an optional "today's next appointment" card. No appointment
      // today is a normal empty state, not an error — throwing here used to
      // break the whole dashboard endpoint with a 404.
      const result = await service.getAppoitnmentToDayEarlyOfDoctor(9, 20);

      expect(result).toBeNull();
    });

    it("returns the mapped appointment when one exists for today", async () => {
      const mockAppointment = {
        id: 3,
        status: AppointmentStatus.CONFIRMED,
        booked_by_user: { id: 9 },
        doctor_schedule: {
          start_time: '00:00:00',
          end_time: '01:00:00',
          day_of_week: 'MON',
          is_active: true,
          doctor: { user: { id: 20 }, specialty: {} },
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
        makeQb({ getOne: jest.fn().mockResolvedValue(mockAppointment) }),
      );

      const result = await service.getAppoitnmentToDayEarlyOfDoctor(9, 20);

      expect(result).toMatchObject({ id: 3 });
    });
  });

  describe('sendAppointmentReminders', () => {
    it('creates a reminder once for an opted-in patient in the configured window', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-01T01:00:00.000Z'));
      const appointment = {
        id: 44,
        status: AppointmentStatus.CONFIRMED,
        appointment_date: new Date('2026-09-02T00:00:00.000Z'),
        patient: {
          id: 5,
          fullname: 'An',
          user: { id: 7 },
        },
        doctor_schedule: {
          start_time: '07:30:00',
          end_time: '08:30:00',
          doctor: { user: { id: 8, fullname: 'Binh' } },
        },
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({ getMany: jest.fn().mockResolvedValue([appointment]) }),
      );
      notificationsService.createAppointmentReminder.mockResolvedValue([
        {
          id: 99,
          title: 'Nhac lich',
          content: 'Noi dung',
        },
      ]);

      await service.sendAppointmentReminders();

      expect(
        notificationsService.createAppointmentReminder,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 44,
          patientUserId: 7,
          doctorUserId: 8,
        }),
      );
      expect(
        settingsService.shouldSendAppointmentReminder,
      ).toHaveBeenCalledWith(7);
      jest.useRealTimers();
    });
  });

  describe('markExpiredPendingAppointments', () => {
    it('chỉ tạo notification cho các lịch thực sự được update thành EXPIRED', async () => {
      const pendingAppointments = [1, 2].map((id) => ({
        id,
        status: AppointmentStatus.PENDING,
        appointment_date: new Date('2000-01-01'),
        booked_by_user: { id: id + 10 },
        doctor_schedule: {
          end_time: '09:00:00',
          doctor: { user: { id: 20 + id, fullname: 'Bình' } },
        },
        patient: { fullname: 'An', user: { id: 11 } },
      }));
      const selectQuery = makeQb({
        getMany: jest.fn().mockResolvedValue(pendingAppointments),
      });
      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ raw: [{ id: 1 }], affected: 1 }),
      };
      const hydratedQuery = makeQb({
        getMany: jest.fn().mockResolvedValue([pendingAppointments[0]]),
      });
      appointmentRepo.createQueryBuilder
        .mockReturnValueOnce(selectQuery)
        .mockReturnValueOnce(updateQuery)
        .mockReturnValueOnce(hydratedQuery);

      await service.markExpiredPendingAppointments();

      expect(redisCacheService.delData).toHaveBeenCalledTimes(1);
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'user:11:appointment:1',
      );
      expect(
        notificationsService.createAppointmentNotifications,
      ).toHaveBeenCalledTimes(1);
      expect(
        notificationsService.createAppointmentNotifications,
      ).toHaveBeenCalledWith(
        NotificationType.APPOINTMENT_EXPIRED,
        expect.objectContaining({ appointmentId: 1 }),
      );
    });
  });

  describe('cancel', () => {
    it('wipes the appointments list cache and this appointment detail key', async () => {
      const notificationQuery = makeQb({
        getOne: jest.fn().mockResolvedValue({
          id: 3,
          status: AppointmentStatus.CANCELLED,
          appointment_date: new Date('2026-09-02'),
          patient: {
            fullname: 'An',
            user: { id: 9 },
          },
          doctor_schedule: {
            doctor: { user: { id: 20, fullname: 'Bình' } },
          },
        }),
      });
      appointmentRepo.createQueryBuilder.mockReturnValue(notificationQuery);
      jest
        .spyOn(service, 'isAppointmentExistAndPending')
        .mockResolvedValue(true as any);
      jest
        .spyOn(service, 'getAppointmentDetail')
        .mockResolvedValue({ id: 3 } as any);

      await service.cancel(9, 3);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'appointments:',
      );
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'user:9:appointment:3',
      );
      expect(
        notificationsService.createAppointmentNotifications,
      ).toHaveBeenCalledWith(
        NotificationType.APPOINTMENT_CANCELLED,
        expect.objectContaining({ appointmentId: 3, patientUserId: 9 }),
      );
      expect(notificationQuery.leftJoinAndSelect).toHaveBeenCalledWith(
        'patient.user',
        'patientUser',
      );
    });

    it('falls back to the patient foreign key when TypeORM does not hydrate patient.user', async () => {
      const notificationQuery = makeQb({
        getOne: jest.fn().mockResolvedValue({
          id: 3,
          status: AppointmentStatus.CANCELLED,
          appointment_date: new Date('2026-09-02'),
          patient: { id: 5, fullname: 'An' },
          doctor_schedule: {
            doctor: { user: { id: 20, fullname: 'Bình' } },
          },
        }),
      });
      const patientOwnerQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ userId: 9 }),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(notificationQuery);
      dataSource.createQueryBuilder.mockReturnValue(patientOwnerQuery);
      jest
        .spyOn(service, 'isAppointmentExistAndPending')
        .mockResolvedValue(true as any);
      jest
        .spyOn(service, 'getAppointmentDetail')
        .mockResolvedValue({ id: 3 } as any);

      await service.cancel(9, 3);

      expect(patientOwnerQuery.where).toHaveBeenCalledWith(
        'patient.id = :patientId',
        { patientId: 5 },
      );
      expect(
        notificationsService.createAppointmentNotifications,
      ).toHaveBeenCalledWith(
        NotificationType.APPOINTMENT_CANCELLED,
        expect.objectContaining({ appointmentId: 3, patientUserId: 9 }),
      );
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
          doctor: { user: { id: 20 }, specialty: {} },
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
        makeQb({ getOne: jest.fn().mockResolvedValue(mockAppointment) }),
      );
      appointmentRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.updateStatus(3, AppointmentStatus.ABSENT, 20, [
        RoleName.DOCTOR,
      ]);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith(
        'appointments:',
      );
      expect(redisCacheService.delData).toHaveBeenCalledWith(
        'user:9:appointment:3',
      );
    });

    it("rejects a doctor updating another doctor's appointment", async () => {
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest.fn().mockResolvedValue({
            id: 3,
            status: AppointmentStatus.CONFIRMED,
            doctor_schedule: { doctor: { user: { id: 20 } } },
          }),
        }),
      );

      await expect(
        service.updateStatus(3, AppointmentStatus.CANCELLED, 21, [
          RoleName.DOCTOR,
        ]),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('rejects transitions out of a terminal status', async () => {
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest.fn().mockResolvedValue({
            id: 3,
            status: AppointmentStatus.CANCELLED,
            doctor_schedule: { doctor: { user: { id: 20 } } },
          }),
        }),
      );

      await expect(
        service.updateStatus(3, AppointmentStatus.CONFIRMED, 1, [
          RoleName.ADMIN,
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('rejects starting the exam (IN_PROGRESS) before the scheduled start time', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest.fn().mockResolvedValue({
            id: 3,
            status: AppointmentStatus.CONFIRMED,
            appointment_date: future,
            doctor_schedule: {
              start_time: '08:00:00',
              end_time: '09:00:00',
              doctor: { user: { id: 20 } },
            },
          }),
        }),
      );

      await expect(
        service.updateStatus(3, AppointmentStatus.IN_PROGRESS, 20, [
          RoleName.DOCTOR,
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('starts the exam (CONFIRMED -> IN_PROGRESS) once the scheduled start time has passed', async () => {
      const mockAppointment = {
        id: 3,
        status: AppointmentStatus.CONFIRMED,
        booked_by_user: { id: 9 },
        appointment_date: new Date(0),
        doctor_schedule: {
          start_time: '00:00:00',
          end_time: '01:00:00',
          doctor: { user: { id: 20 }, specialty: {} },
        },
        patient: {},
        examination_result: null,
        satisfaction_rating: null,
        created_at: new Date(0),
        updated_at: new Date(0),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({ getOne: jest.fn().mockResolvedValue(mockAppointment) }),
      );
      appointmentRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.updateStatus(3, AppointmentStatus.IN_PROGRESS, 20, [
        RoleName.DOCTOR,
      ]);

      expect(appointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.IN_PROGRESS }),
      );
    });

    it('rejects marking COMPLETED directly from CONFIRMED (must start the exam first)', async () => {
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest.fn().mockResolvedValue({
            id: 3,
            status: AppointmentStatus.CONFIRMED,
            appointment_date: new Date(0),
            doctor_schedule: {
              start_time: '00:00:00',
              end_time: '01:00:00',
              doctor: { user: { id: 20 } },
            },
          }),
        }),
      );

      await expect(
        service.updateStatus(3, AppointmentStatus.COMPLETED, 20, [
          RoleName.DOCTOR,
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('completes the exam (IN_PROGRESS -> COMPLETED)', async () => {
      const mockAppointment = {
        id: 3,
        status: AppointmentStatus.IN_PROGRESS,
        booked_by_user: { id: 9 },
        appointment_date: new Date(0),
        doctor_schedule: {
          start_time: '00:00:00',
          end_time: '01:00:00',
          doctor: { user: { id: 20 }, specialty: {} },
        },
        patient: {},
        examination_result: null,
        satisfaction_rating: null,
        created_at: new Date(0),
        updated_at: new Date(0),
      };
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({ getOne: jest.fn().mockResolvedValue(mockAppointment) }),
      );
      appointmentRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.updateStatus(3, AppointmentStatus.COMPLETED, 20, [
        RoleName.DOCTOR,
      ]);

      expect(appointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.COMPLETED }),
      );
    });
  });

  describe('create', () => {
    const futureDate = '2099-01-05';
    const weekday =
      dayNumberToEnum[new Date(`${futureDate}T00:00:00`).getDay()];
    const pastDate = '2000-01-01';

    const bookedUser = { id: 9, roles: [] as any[] };
    const patient = { id: 5 };
    const detailAppointment = {
      id: 100,
      status: AppointmentStatus.PENDING,
      booked_by_user: { id: 9 },
      doctor_schedule: {
        start_time: '08:00:00',
        end_time: '09:00:00',
        day_of_week: weekday,
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

    beforeEach(() => {
      usersService.findByUserId.mockResolvedValue(bookedUser);
    });

    function wireTransaction(manager: any) {
      dataSource.transaction.mockImplementation((cb: any) => cb(manager));
    }

    it('specific-schedule request (doctor_schedule_id) behaves exactly as before and never queries auto-select candidates', async () => {
      const chosenSchedule = {
        id: 42,
        day_of_week: weekday,
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
      };
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb();
      const appointmentQb = makeManagerQb({
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null) // patient-conflict check: no conflict
          .mockResolvedValueOnce(detailAppointment), // detail fetch
      });
      const manager = makeMockManager({
        relativeQb,
        doctorScheduleQb,
        appointmentQb,
        findOneResult: chosenSchedule,
      });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        doctor_schedule_id: 42,
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await service.create(9, body);

      expect(manager.findOne).toHaveBeenCalled();
      expect(doctorScheduleQb.getMany).not.toHaveBeenCalled();
      expect(specialtiesService.findSpecialtyById).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledWith(
        Appointment,
        expect.objectContaining({ doctor_schedule: chosenSchedule }),
      );
    });

    it('creates a relative on the fly via new_relative_profile and books using its id, without touching lockAndValidatePatient', async () => {
      const chosenSchedule = {
        id: 42,
        day_of_week: weekday,
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
      };
      const newRelative = { id: 77 };
      relativesService.findOrCreateForBooking.mockResolvedValue(newRelative);

      const relativeQb = makeManagerQb();
      const doctorScheduleQb = makeManagerQb();
      const appointmentQb = makeManagerQb({
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(detailAppointment),
      });
      const manager = makeMockManager({
        relativeQb,
        doctorScheduleQb,
        appointmentQb,
        findOneResult: chosenSchedule,
      });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        doctor_schedule_id: 42,
        new_relative_profile: {
          fullname: 'Nguyen Van A',
          relationship_code: 'con_gai',
          dob: '2015-05-01',
          gender: false,
        },
        booking_mode: BookingMode.USER_SELECT,
      };

      await service.create(9, body);

      expect(relativesService.findOrCreateForBooking).toHaveBeenCalledWith(
        manager,
        9,
        body.new_relative_profile,
      );
      expect(relativeQb.getOne).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledWith(
        Appointment,
        expect.objectContaining({ patient: newRelative }),
      );
    });

    it('auto-select mode picks the earliest available schedule (ORDER BY start_time ASC, id ASC)', async () => {
      const earliest = {
        id: 10,
        day_of_week: weekday,
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
      };
      const later = {
        id: 20,
        day_of_week: weekday,
        start_time: '09:00:00',
        end_time: '10:00:00',
        is_active: true,
      };
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb({
        getMany: jest.fn().mockResolvedValue([earliest, later]),
      });
      const appointmentQb = makeManagerQb({
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(detailAppointment),
      });
      const manager = makeMockManager({
        relativeQb,
        doctorScheduleQb,
        appointmentQb,
      });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 2,
        start_time: '08:00',
        end_time: '10:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await service.create(9, body);

      expect(doctorScheduleQb.orderBy).toHaveBeenCalledWith(
        'doctor_schedule.start_time',
        'ASC',
      );
      expect(doctorScheduleQb.addOrderBy).toHaveBeenCalledWith(
        'doctor_schedule.id',
        'ASC',
      );
      expect(manager.save).toHaveBeenCalledWith(
        Appointment,
        expect.objectContaining({ doctor_schedule: earliest }),
      );
    });

    it('auto-select mode filters by is_active, weekday, specialty, time window, and excludes already-booked schedules', async () => {
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb({
        getMany: jest.fn().mockResolvedValue([]),
      });
      const manager = makeMockManager({ relativeQb, doctorScheduleQb });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 2,
        start_time: '08:00',
        end_time: '10:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(doctorScheduleQb.where).toHaveBeenCalledWith(
        'doctor_schedule.is_active = true',
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'doctor_schedule.day_of_week = :weekday',
        { weekday },
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'specialty.id = :specialty_id',
        { specialty_id: 2 },
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'doctor_schedule.start_time < :end_time',
        { end_time: '10:00' },
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'doctor_schedule.end_time > :start_time',
        { start_time: '08:00' },
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        expect.objectContaining({ appointment_date: futureDate }),
      );
    });

    it('auto-select mode without end_time uses point-in-time containment (start_time <= :start_time AND end_time > :start_time)', async () => {
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb({
        getMany: jest.fn().mockResolvedValue([]),
      });
      const manager = makeMockManager({ relativeQb, doctorScheduleQb });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 2,
        start_time: '08:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'doctor_schedule.start_time <= :start_time',
        { start_time: '08:00' },
      );
      expect(doctorScheduleQb.andWhere).toHaveBeenCalledWith(
        'doctor_schedule.end_time > :start_time',
        { start_time: '08:00' },
      );
    });

    it('auto-select mode with no candidates returns the stable unavailable-slot code and saves no appointment', async () => {
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb({
        getMany: jest.fn().mockResolvedValue([]),
      });
      const manager = makeMockManager({ relativeQb, doctorScheduleQb });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 2,
        start_time: '08:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toMatchObject({
        response: {
          code: APPOINTMENT_SLOT_UNAVAILABLE,
          message:
            'Không tìm thấy bác sĩ/ca khám phù hợp còn trống trong khung giờ yêu cầu.',
        },
        status: 409,
      });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('auto-select mode with an unknown specialty_id throws 404 and never queries doctor schedules', async () => {
      specialtiesService.findSpecialtyById.mockRejectedValue(
        new NotFoundException('Chuyên khoa không tồn tại.'),
      );
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb();
      const manager = makeMockManager({ relativeQb, doctorScheduleQb });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 999,
        start_time: '08:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(doctorScheduleQb.getMany).not.toHaveBeenCalled();
    });

    it('rejects with 409 when the patient already has a conflicting appointment (auto-select mode)', async () => {
      const candidate = {
        id: 10,
        day_of_week: weekday,
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
      };
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const doctorScheduleQb = makeManagerQb({
        getMany: jest.fn().mockResolvedValue([candidate]),
      });
      const appointmentQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValueOnce({ id: 777 }), // existing conflicting appointment
      });
      const manager = makeMockManager({
        relativeQb,
        doctorScheduleQb,
        appointmentQb,
      });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        specialty_id: 2,
        start_time: '08:00',
        end_time: '09:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toThrow(
        'Bệnh nhân đã có lịch hẹn khác vào thời gian này.',
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects with 409 when the patient already has a conflicting appointment (specific-schedule mode)', async () => {
      const chosenSchedule = {
        id: 42,
        day_of_week: weekday,
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
      };
      const relativeQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValue(patient),
      });
      const appointmentQb = makeManagerQb({
        getOne: jest.fn().mockResolvedValueOnce({ id: 777 }),
      });
      const manager = makeMockManager({
        relativeQb,
        appointmentQb,
        findOneResult: chosenSchedule,
      });
      wireTransaction(manager);

      const body: BodyCreateAppointmentDto = {
        appointment_date: futureDate,
        doctor_schedule_id: 42,
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, body)).rejects.toThrow(
        'Bệnh nhân đã có lịch hẹn khác vào thời gian này.',
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects a past appointment_date with 400, for both modes', async () => {
      const manager = makeMockManager();
      wireTransaction(manager);

      const specificBody: BodyCreateAppointmentDto = {
        appointment_date: pastDate,
        doctor_schedule_id: 42,
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };
      const autoBody: BodyCreateAppointmentDto = {
        appointment_date: pastDate,
        specialty_id: 2,
        start_time: '08:00',
        relative_id: 5,
        booking_mode: BookingMode.USER_SELECT,
      };

      await expect(service.create(9, specificBody)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.create(9, autoBody)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    describe('blocks today with an already-past start_time', () => {
      const todayDateStr = '2026-09-01';
      const todayWeekday =
        dayNumberToEnum[new Date(`${todayDateStr}T00:00:00`).getDay()];

      beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 8, 1, 15, 0, 0));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('specific-schedule mode rejects when the chosen schedule start_time already passed', async () => {
        const chosenSchedule = {
          id: 42,
          day_of_week: todayWeekday,
          start_time: '08:00:00',
          end_time: '09:00:00',
          is_active: true,
        };
        const relativeQb = makeManagerQb({
          getOne: jest.fn().mockResolvedValue(patient),
        });
        const manager = makeMockManager({
          relativeQb,
          findOneResult: chosenSchedule,
        });
        wireTransaction(manager);

        const body: BodyCreateAppointmentDto = {
          appointment_date: todayDateStr,
          doctor_schedule_id: 42,
          relative_id: 5,
          booking_mode: BookingMode.USER_SELECT,
        };

        await expect(service.create(9, body)).rejects.toThrow(
          'Không thể đặt lịch cho khung giờ đã qua.',
        );
        expect(manager.save).not.toHaveBeenCalled();
      });

      it('auto-select mode rejects when the resolved schedule start_time already passed', async () => {
        const candidate = {
          id: 10,
          day_of_week: todayWeekday,
          start_time: '08:00:00',
          end_time: '09:00:00',
          is_active: true,
        };
        const relativeQb = makeManagerQb({
          getOne: jest.fn().mockResolvedValue(patient),
        });
        const doctorScheduleQb = makeManagerQb({
          getMany: jest.fn().mockResolvedValue([candidate]),
        });
        const manager = makeMockManager({ relativeQb, doctorScheduleQb });
        wireTransaction(manager);

        const body: BodyCreateAppointmentDto = {
          appointment_date: todayDateStr,
          specialty_id: 2,
          start_time: '07:00',
          relative_id: 5,
          booking_mode: BookingMode.AI_SELECT,
        };

        await expect(service.create(9, body)).rejects.toThrow(
          'Không thể đặt lịch cho khung giờ đã qua.',
        );
        expect(manager.save).not.toHaveBeenCalled();
      });

      it('rejects when start_time exactly equals the current time (boundary, inclusive)', async () => {
        const chosenSchedule = {
          id: 42,
          day_of_week: todayWeekday,
          start_time: '15:00:00',
          end_time: '16:00:00',
          is_active: true,
        };
        const relativeQb = makeManagerQb({
          getOne: jest.fn().mockResolvedValue(patient),
        });
        const manager = makeMockManager({
          relativeQb,
          findOneResult: chosenSchedule,
        });
        wireTransaction(manager);

        const body: BodyCreateAppointmentDto = {
          appointment_date: todayDateStr,
          doctor_schedule_id: 42,
          relative_id: 5,
          booking_mode: BookingMode.USER_SELECT,
        };

        await expect(service.create(9, body)).rejects.toThrow(
          'Không thể đặt lịch cho khung giờ đã qua.',
        );
      });

      it('does not reject today when the start_time is still in the future', async () => {
        const chosenSchedule = {
          id: 42,
          day_of_week: todayWeekday,
          start_time: '16:00:00',
          end_time: '17:00:00',
          is_active: true,
        };
        const relativeQb = makeManagerQb({
          getOne: jest.fn().mockResolvedValue(patient),
        });
        const appointmentQb = makeManagerQb({
          getOne: jest
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(detailAppointment),
        });
        const manager = makeMockManager({
          relativeQb,
          appointmentQb,
          findOneResult: chosenSchedule,
        });
        wireTransaction(manager);

        const body: BodyCreateAppointmentDto = {
          appointment_date: todayDateStr,
          doctor_schedule_id: 42,
          relative_id: 5,
          booking_mode: BookingMode.USER_SELECT,
        };

        await service.create(9, body);

        expect(manager.save).toHaveBeenCalled();
      });

      it('does not reject a genuinely future date even with an early start_time', async () => {
        const chosenSchedule = {
          id: 42,
          day_of_week: weekday,
          start_time: '00:01:00',
          end_time: '01:00:00',
          is_active: true,
        };
        const relativeQb = makeManagerQb({
          getOne: jest.fn().mockResolvedValue(patient),
        });
        const appointmentQb = makeManagerQb({
          getOne: jest
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(detailAppointment),
        });
        const manager = makeMockManager({
          relativeQb,
          appointmentQb,
          findOneResult: chosenSchedule,
        });
        wireTransaction(manager);

        const body: BodyCreateAppointmentDto = {
          appointment_date: futureDate,
          doctor_schedule_id: 42,
          relative_id: 5,
          booking_mode: BookingMode.USER_SELECT,
        };

        await service.create(9, body);

        expect(manager.save).toHaveBeenCalled();
      });
    });
  });

  describe('createWithNotifications', () => {
    it('maps a unique_doctor_schedule_date race (23505) to a 409 Conflict for either booking mode', async () => {
      const raceError = new QueryFailedError(
        'INSERT INTO appointments...',
        undefined,
        {
          code: '23505',
          constraint: 'unique_doctor_schedule_date',
        } as any,
      );
      jest.spyOn(service, 'create').mockRejectedValue(raceError);

      const body: BodyCreateAppointmentDto = {
        appointment_date: '2099-01-05',
        specialty_id: 2,
        start_time: '08:00',
        relative_id: 5,
        booking_mode: BookingMode.AI_SELECT,
      };

      await expect(service.createWithNotifications(9, body)).rejects.toThrow(
        'Ca này đã có lịch hẹn! Vui lòng chọn ca khác.',
      );
      expect(
        notificationsService.createAppointmentNotifications,
      ).not.toHaveBeenCalled();
      expect(gateway.notifyBookAppointmentFail).toHaveBeenCalledWith(
        9,
        'Ca này đã có lịch hẹn! Vui lòng chọn ca khác.',
      );
    });
  });
});
