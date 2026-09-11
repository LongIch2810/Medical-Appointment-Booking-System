import { ConflictException, NotFoundException } from '@nestjs/common';
import { RelationshipsService } from 'src/modules/relationships/relationships.service';

function makeQuery(result: unknown = null) {
  const query = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getOne: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest
      .fn()
      .mockResolvedValue([
        [{ id: 1, relationship_code: 'PARENT', relationship_name: 'Parent' }],
        1,
      ]),
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

describe('RelationshipsService', () => {
  let repository: any;
  let service: RelationshipsService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ id: 1, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new RelationshipsService(repository);
  });

  it('creates a relationship only when both name and code are unique', async () => {
    repository.findOne.mockResolvedValue(null);
    const body = {
      relationship_code: 'PARENT',
      relationship_name: 'Parent',
      description: 'Family',
    };
    await expect(service.create(body)).resolves.toMatchObject(body);
    expect(repository.save).toHaveBeenCalled();
  });

  it('rejects a duplicate name or code', async () => {
    repository.findOne
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);
    await expect(
      service.create({
        relationship_code: 'PARENT',
        relationship_name: 'Parent',
      } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('checks renamed relationships case-insensitively excluding the current code', async () => {
    repository.findOne.mockResolvedValue({
      relationship_code: 'PARENT',
      relationship_name: 'Parent',
      description: 'Old',
    });
    const query = makeQuery(null);
    repository.createQueryBuilder.mockReturnValue(query);

    await expect(
      service.update('PARENT', {
        relationship_name: 'Guardian',
        description: 'New',
      }),
    ).resolves.toMatchObject({
      relationship_name: 'Guardian',
      description: 'New',
    });
    expect(query.andWhere).toHaveBeenCalledWith(
      'relationship.relationship_code != :relationshipCode',
      { relationshipCode: 'PARENT' },
    );
  });

  it('rejects a conflicting renamed relationship', async () => {
    repository.findOne.mockResolvedValue({
      relationship_code: 'PARENT',
      relationship_name: 'Parent',
    });
    repository.createQueryBuilder.mockReturnValue(makeQuery({ id: 2 }));
    await expect(
      service.update('PARENT', { relationship_name: 'Duplicate' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('filters and maps paginated relationships', async () => {
    const query = makeQuery();
    repository.createQueryBuilder.mockReturnValue(query);
    const result = await service.filterAndPagination({
      page: 0,
      limit: 0,
      search: 'parent',
      arrange: 'asc',
    });
    expect(result).toMatchObject({
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
    });
    expect(result.relationships[0]).toMatchObject({
      relationship_code: 'PARENT',
    });
    expect(query.orWhere).toHaveBeenCalled();
  });

  it('throws for missing details', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.getRelationshipDetail('UNKNOWN'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.findByRelationshipCode('UNKNOWN'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft deletes a verified relationship code', async () => {
    repository.findOne.mockResolvedValue({ relationship_code: 'PARENT' });
    await expect(service.remove('PARENT')).resolves.toHaveProperty('message');
    expect(repository.softDelete).toHaveBeenCalledWith({
      relationship_code: 'PARENT',
    });
  });
});
