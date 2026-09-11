import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExaminationResultService } from 'src/modules/examination-result/examination-result.service';

function makeExam(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    symptoms: 'cough',
    diagnosis: 'cold',
    treatment: 'rest',
    prescription: 'none',
    appointment: {
      id: 10,
      patient: { id: 20 },
      doctor_schedule: {
        id: 40,
        day_of_week: 'Monday',
        start_time: '08:00:00',
        end_time: '09:00:00',
        is_active: true,
        doctor: { id: 30, user: { id: 7 } },
      },
    },
    ...overrides,
  };
}

function makeQuery(result: unknown = makeExam()) {
  const query = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getOne: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest.fn().mockResolvedValue([[makeExam()], 1]),
  };
  Object.values(query).forEach((value) => {
    if (
      jest.isMockFunction(value) &&
      value !== query.getOne &&
      value !== query.getManyAndCount
    ) {
      value.mockReturnValue(query);
    }
  });
  return query;
}

describe('ExaminationResultService', () => {
  let repository: any;
  let appointments: any;
  let relatives: any;
  let users: any;
  let service: ExaminationResultService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => makeExam(value)),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(3),
      createQueryBuilder: jest.fn(() => makeQuery()),
    };
    appointments = {
      isAppointmentCompletedAndOwnedByDoctorUser: jest.fn(),
    };
    relatives = { isRelativeExistsByRelativeId: jest.fn() };
    users = { isUserExists: jest.fn() };
    service = new ExaminationResultService(
      repository,
      appointments,
      relatives,
      users,
      {} as never,
    );
  });

  it('rejects an appointment not completed and owned by the doctor', async () => {
    appointments.isAppointmentCompletedAndOwnedByDoctorUser.mockResolvedValue(
      false,
    );
    await expect(
      service.create(7, { appointment_id: 10 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a second result for the same appointment', async () => {
    appointments.isAppointmentCompletedAndOwnedByDoctorUser.mockResolvedValue(
      true,
    );
    repository.findOne.mockResolvedValue({ id: 2 });
    await expect(
      service.create(7, { appointment_id: 10 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists a result linked to its appointment', async () => {
    appointments.isAppointmentCompletedAndOwnedByDoctorUser.mockResolvedValue(
      true,
    );
    repository.findOne.mockResolvedValue(null);
    repository.save.mockResolvedValue(makeExam());
    const body = {
      appointment_id: 10,
      symptoms: 'cough',
      diagnosis: 'cold',
      treatment: 'rest',
      prescription: 'none',
    };

    await expect(service.create(7, body)).resolves.toMatchObject({ id: 1 });
    expect(repository.create).toHaveBeenCalledWith({
      symptoms: 'cough',
      diagnosis: 'cold',
      treatment: 'rest',
      prescription: 'none',
      appointment: { id: 10 },
    });
  });

  it('enforces nested doctor ownership before updating', async () => {
    repository.createQueryBuilder.mockReturnValue(
      makeQuery(makeExam({ appointment: null })),
    );
    await expect(
      service.update(7, 1, { diagnosis: 'new' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    repository.createQueryBuilder.mockReturnValue(
      makeQuery(
        makeExam({
          appointment: { doctor_schedule: { doctor: { user: { id: 8 } } } },
        }),
      ),
    );
    await expect(
      service.update(7, 1, { diagnosis: 'new' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates an owned examination result', async () => {
    const exam = makeExam();
    repository.createQueryBuilder.mockReturnValue(makeQuery(exam));
    await expect(
      service.update(7, 1, { diagnosis: 'recovered' }),
    ).resolves.toMatchObject({
      diagnosis: 'recovered',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ diagnosis: 'recovered' }),
    );
  });

  it('throws when a requested result cannot be found', async () => {
    repository.createQueryBuilder.mockReturnValue(makeQuery(null));
    await expect(service.findExaminationResultById(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.findExaminationResultByAppointmentId(404),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters doctor results with clamped pagination and date', async () => {
    users.isUserExists.mockResolvedValue(true);
    const query = makeQuery();
    repository.createQueryBuilder.mockReturnValue(query);
    const result = await service.findExaminationResultsByDoctorUserId(7, {
      page: 0,
      limit: 0,
      arrange: 'desc',
      date: '2026-09-03',
    });
    expect(result).toMatchObject({ total: 1, page: 1, limit: 1 });
    expect(query.where).toHaveBeenCalledWith('doctor_user.id = :userId', {
      userId: 7,
    });
    expect(query.andWhere).toHaveBeenCalledWith(
      'examination_result.created_at >= :date',
      {
        date: '2026-09-03',
      },
    );
  });

  it('checks relative ownership before returning relative results', async () => {
    relatives.isRelativeExistsByRelativeId.mockResolvedValue(false);
    await expect(
      service.findExaminationResultsByRelativeId(7, 20, {
        page: 1,
        limit: 10,
        arrange: 'asc',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the deleted result without re-querying after soft delete', async () => {
    const exam = makeExam();
    const query = makeQuery(exam);
    repository.createQueryBuilder.mockReturnValueOnce(query);
    // If remove() re-queries after soft-deleting, this second call simulates
    // TypeORM's default soft-delete filtering excluding the now-deleted row,
    // which is exactly the regression this test guards against.
    repository.createQueryBuilder.mockReturnValueOnce(makeQuery(null));

    await expect(service.remove(7, 1)).resolves.toMatchObject({ id: 1 });
    expect(repository.softDelete).toHaveBeenCalledWith(1);
    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('rejects removal by a doctor who does not own the result', async () => {
    repository.createQueryBuilder.mockReturnValue(
      makeQuery(
        makeExam({
          appointment: { doctor_schedule: { doctor: { user: { id: 8 } } } },
        }),
      ),
    );

    await expect(service.remove(7, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('counts results through the patient-user relation', async () => {
    await expect(service.numberOfExaminationResultsByUserId(9)).resolves.toBe(
      3,
    );
    expect(repository.count).toHaveBeenCalledWith({
      where: { appointment: { patient: { user: { id: 9 } } } },
    });
  });
});
