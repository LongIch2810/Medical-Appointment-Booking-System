import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { SatisfactionRatingService } from 'src/modules/satisfaction-rating/satisfaction-rating.service';
import { PERMISSIONS } from 'src/utils/constants';

function builder(result: unknown = { id: 1 }) {
  const query = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
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

describe('SatisfactionRatingService', () => {
  let repository: any;
  let appointments: any;
  let rolePermissionService: { getPermissionsByRoles: jest.Mock };
  let redisCacheService: { delByPrefix: jest.Mock; delData: jest.Mock };
  let service: SatisfactionRatingService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ id: 1, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    appointments = { isAppointmentExistsCompletedAndResult: jest.fn() };
    rolePermissionService = { getPermissionsByRoles: jest.fn() };
    redisCacheService = {
      delByPrefix: jest.fn().mockResolvedValue(undefined),
      delData: jest.fn().mockResolvedValue(undefined),
    };
    service = new SatisfactionRatingService(
      repository,
      appointments,
      rolePermissionService as never,
      redisCacheService as never,
    );
  });

  it('requires a completed appointment with an examination result', async () => {
    appointments.isAppointmentExistsCompletedAndResult.mockResolvedValue(false);
    await expect(
      service.create(5, { appointment_id: 10, rating_score: 5 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an existing appointment rating', async () => {
    appointments.isAppointmentExistsCompletedAndResult.mockResolvedValue(true);
    repository.findOne.mockResolvedValue({ id: 2 });
    await expect(
      service.create(5, { appointment_id: 10, rating_score: 5 } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a rating linked to its appointment', async () => {
    appointments.isAppointmentExistsCompletedAndResult.mockResolvedValue(true);
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.create(5, {
        appointment_id: 10,
        rating_score: 4,
        feedback: 'Good',
      }),
    ).resolves.toHaveProperty('message');
    expect(repository.create).toHaveBeenCalledWith({
      rating_score: 4,
      feedback: 'Good',
      appointment: { id: 10 },
    });
    expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctor:');
    expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctors:');
    // Regression test: the patient's appointments list/detail cache embeds
    // satisfaction_rating to decide whether to show the "Đánh giá" button —
    // without invalidating it, the button kept showing for up to an hour
    // after a successful rating.
    expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('appointments:');
    expect(redisCacheService.delData).toHaveBeenCalledWith(
      'user:5:appointment:10',
    );
  });

  it('translates a database uniqueness race to ConflictException', async () => {
    appointments.isAppointmentExistsCompletedAndResult.mockResolvedValue(true);
    repository.findOne.mockResolvedValue(null);
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' } as never),
    );
    await expect(
      service.create(5, { appointment_id: 10, rating_score: 4 } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates only an existing rating', async () => {
    repository.createQueryBuilder.mockReturnValue(builder(null));
    await expect(
      service.update(404, { feedback: 'new' }, 9, ['PATIENT']),
    ).rejects.toBeInstanceOf(BadRequestException);

    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      PERMISSIONS.SATISFACTION_RATING_UPDATE,
    ]);
    repository.createQueryBuilder.mockReturnValue(
      builder({
        id: 1,
        rating_score: 3,
        appointment: { patient: { user: { id: 9 } } },
      }),
    );
    await expect(
      service.update(1, { rating_score: 5 }, 9, ['PATIENT']),
    ).resolves.toMatchObject({
      id: 1,
      rating_score: 5,
    });
    expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctor:');
    expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctors:');
  });

  it("rejects a patient updating another user's rating (IDOR)", async () => {
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      PERMISSIONS.SATISFACTION_RATING_UPDATE,
    ]);
    repository.createQueryBuilder.mockReturnValue(
      builder({
        id: 1,
        rating_score: 3,
        appointment: { patient: { user: { id: 12 } } },
      }),
    );

    await expect(
      service.update(1, { rating_score: 1 }, 99, ['PATIENT']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows a manage-permission caller to update any rating', async () => {
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      PERMISSIONS.SATISFACTION_RATING_MANAGE,
    ]);
    repository.createQueryBuilder.mockReturnValue(
      builder({
        id: 1,
        rating_score: 3,
        appointment: { patient: { user: { id: 12 } } },
      }),
    );

    await expect(
      service.update(1, { rating_score: 2 }, 999, ['ADMIN']),
    ).resolves.toMatchObject({ id: 1, rating_score: 2 });
  });

  it('applies date and doctor filters with inclusive end-of-day', async () => {
    const query = builder();
    repository.createQueryBuilder.mockReturnValue(query);
    const result = await service.filterAndPagination({
      page: 0,
      limit: 0,
      arrange: 'desc',
      fromDate: '2026-09-01',
      toDate: '2026-09-03',
      doctorId: 8,
    });
    expect(result).toEqual({
      satisfactionRatings: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });
    expect(query.andWhere).toHaveBeenCalledTimes(3);
    const endDate = query.andWhere.mock.calls[1][1].toDate as Date;
    expect([
      endDate.getHours(),
      endDate.getMinutes(),
      endDate.getSeconds(),
      endDate.getMilliseconds(),
    ]).toEqual([23, 59, 59, 999]);
  });

  it('loads rating details with selected appointment relations for the owning patient', async () => {
    const query = builder({
      id: 9,
      appointment: { patient: { user: { id: 9 } } },
    });
    repository.createQueryBuilder.mockReturnValue(query);
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      PERMISSIONS.SATISFACTION_RATING_READ,
    ]);

    await expect(service.findById(9, 9, ['PATIENT'])).resolves.toMatchObject({
      id: 9,
    });
    expect(query.where).toHaveBeenCalledWith(
      'satisfaction_rating.id = :satisfactionRatingId',
      { satisfactionRatingId: 9 },
    );
  });

  it('rejects missing rating details', async () => {
    repository.createQueryBuilder.mockReturnValue(builder(null));
    await expect(
      service.findById(404, 9, ['PATIENT']),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a patient reading another user's rating (IDOR)", async () => {
    repository.createQueryBuilder.mockReturnValue(
      builder({ id: 9, appointment: { patient: { user: { id: 12 } } } }),
    );
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      PERMISSIONS.SATISFACTION_RATING_READ,
    ]);

    await expect(
      service.findById(9, 99, ['PATIENT']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
