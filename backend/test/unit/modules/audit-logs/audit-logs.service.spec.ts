import { NotFoundException } from '@nestjs/common';
import { AuditLogsService } from 'src/modules/audit-logs/audit-logs.service';

function queryBuilder() {
  const query = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  Object.values(query).forEach((value) => {
    if (jest.isMockFunction(value) && value !== query.getManyAndCount)
      value.mockReturnValue(query);
  });
  return query;
}

describe('AuditLogsService', () => {
  let repository: any;
  let users: any;
  let service: AuditLogsService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ id: 1, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      createQueryBuilder: jest.fn(),
    };
    users = { isUserExists: jest.fn() };
    service = new AuditLogsService(repository, users);
  });

  it('creates system audit records without a user relation', async () => {
    await expect(
      service.create({ action: 'SYSTEM', user_id: undefined } as never),
    ).resolves.toMatchObject({
      action: 'SYSTEM',
      user: null,
    });
    expect(users.isUserExists).not.toHaveBeenCalled();
  });

  it('validates and links an actor when user_id is supplied', async () => {
    users.isUserExists.mockResolvedValue(true);
    await service.create({ action: 'UPDATE', user_id: 7 } as never);
    expect(repository.create).toHaveBeenCalledWith({
      action: 'UPDATE',
      user: { id: 7 },
    });
  });

  it('rejects an audit record referencing a missing user', async () => {
    users.isUserExists.mockResolvedValue(false);
    await expect(
      service.create({ action: 'UPDATE', user_id: 404 } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies all filters, including false isSuccess, and clamps pagination', async () => {
    const query = queryBuilder();
    repository.createQueryBuilder.mockReturnValue(query);
    const result = await service.filterAndPagination({
      page: 0,
      limit: 0,
      arrange: 'desc',
      search: 'appointment',
      action: 'UPDATE',
      entityName: 'Appointment',
      userId: 7,
      method: 'patch',
      isSuccess: false,
      fromDate: '2026-09-01',
      toDate: '2026-09-03',
    } as never);
    expect(result).toMatchObject({
      auditLogs: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    expect(query.andWhere).toHaveBeenCalledTimes(8);
    expect(query.andWhere).toHaveBeenCalledWith('auditLog.method = :method', {
      method: 'PATCH',
    });
    expect(query.andWhere).toHaveBeenCalledWith(
      'auditLog.is_success = :isSuccess',
      { isSuccess: false },
    );
  });
});
