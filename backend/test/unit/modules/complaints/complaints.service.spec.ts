import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ComplaintStatus } from 'src/entities/complaint.entity';
import { ComplaintsService } from 'src/modules/complaints/complaints.service';
import { PERMISSIONS } from 'src/utils/constants';

function makeQueryBuilder() {
  const builder = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
  };
  Object.values(builder).forEach((value) => {
    if (jest.isMockFunction(value) && value !== builder.getManyAndCount) {
      value.mockReturnValue(builder);
    }
  });
  return builder;
}

describe('ComplaintsService', () => {
  let repository: any;
  let rolePermissionService: { getPermissionsByRoles: jest.Mock };
  let service: ComplaintsService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ id: 1, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      findOne: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };
    rolePermissionService = { getPermissionsByRoles: jest.fn() };
    service = new ComplaintsService(repository, rolePermissionService as never);
  });

  it('creates a pending complaint linked to the authenticated caller', async () => {
    await expect(
      service.create(12, { title: 'Waiting time', description: 'Too long' }),
    ).resolves.toMatchObject({
      complaint_status: ComplaintStatus.PENDING,
      user: { id: 12 },
    });
  });

  it('applies every supplied filter and clamps invalid pagination', async () => {
    const builder = makeQueryBuilder();
    repository.createQueryBuilder.mockReturnValue(builder);

    const result = await service.filterAndPagination({
      page: 0,
      limit: 0,
      search: 'patient',
      status: ComplaintStatus.PENDING,
      userId: 12,
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
      arrange: 'desc',
    });

    expect(result).toMatchObject({ total: 1, page: 1, limit: 10 });
    expect(builder.andWhere).toHaveBeenCalledTimes(5);
    expect(builder.skip).toHaveBeenCalledWith(0);
    expect(builder.take).toHaveBeenCalledWith(10);
  });

  it('loads complaint details with the user relation', async () => {
    repository.findOne.mockResolvedValue({ id: 4, title: 'Found' });
    await expect(service.findById(4)).resolves.toMatchObject({ id: 4 });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
      relations: ['user'],
    });
  });

  it('rejects a missing complaint', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findById(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('findByIdForRequester', () => {
    it("rejects a patient reading another user's complaint (IDOR)", async () => {
      repository.findOne.mockResolvedValue({ id: 4, user: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.COMPLAINT_READ,
        PERMISSIONS.COMPLAINT_CREATE,
      ]);

      await expect(
        service.findByIdForRequester(4, 99, ['PATIENT']),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows the owning patient to read their own complaint', async () => {
      repository.findOne.mockResolvedValue({ id: 4, user: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.COMPLAINT_READ,
      ]);

      await expect(
        service.findByIdForRequester(4, 12, ['PATIENT']),
      ).resolves.toMatchObject({ id: 4 });
    });

    it('allows an admin holding complaint:manage to read any complaint', async () => {
      repository.findOne.mockResolvedValue({ id: 4, user: { id: 12 } });
      rolePermissionService.getPermissionsByRoles.mockResolvedValue([
        PERMISSIONS.COMPLAINT_MANAGE,
      ]);

      await expect(
        service.findByIdForRequester(4, 999, ['ADMIN']),
      ).resolves.toMatchObject({ id: 4 });
    });
  });

  it('only changes explicitly supplied fields', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      title: 'Old',
      description: 'Keep',
      complaint_status: ComplaintStatus.PENDING,
      response: null,
    });

    await expect(
      service.update(1, { title: 'New', response: 'Resolved' }),
    ).resolves.toMatchObject({
      title: 'New',
      description: 'Keep',
      complaint_status: ComplaintStatus.PENDING,
      response: 'Resolved',
    });
  });

  it('soft-deletes only after existence has been verified', async () => {
    repository.findOne.mockResolvedValue({ id: 3 });
    await expect(service.remove(3)).resolves.toHaveProperty('message');
    expect(repository.softDelete).toHaveBeenCalledWith(3);
  });
});
