import { ConflictException, NotFoundException } from '@nestjs/common';
import { Brackets, QueryFailedError } from 'typeorm';
import { TagsService } from 'src/modules/tags/tags.service';

function queryBuilder(result: unknown = null) {
  const builder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getOne: jest.fn().mockResolvedValue(result),
    getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
  };
  Object.values(builder).forEach((value) => {
    if (
      jest.isMockFunction(value) &&
      value !== builder.getOne &&
      value !== builder.getManyAndCount
    ) {
      value.mockReturnValue(builder);
    }
  });
  return builder;
}

describe('TagsService', () => {
  let repository: any;
  let service: TagsService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => ({ id: 1, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      findOne: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };
    service = new TagsService(repository);
  });

  it('creates a unique tag with a normalized slug', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.create({ name: 'Heart Health' })).resolves.toEqual({
      id: 1,
      name: 'Heart Health',
      slug: 'heart-health',
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Heart Health',
      slug: 'heart-health',
    });
  });

  it('rejects an application-level duplicate', async () => {
    repository.findOne
      .mockResolvedValueOnce({ id: 2 })
      .mockResolvedValueOnce(null);

    await expect(service.create({ name: 'Duplicate' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('translates a PostgreSQL unique violation into ConflictException', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' } as never),
    );

    await expect(service.create({ name: 'Raced tag' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns the existing tag when an update has no name change', async () => {
    repository.findOne.mockResolvedValue({
      id: 1,
      name: 'Stable',
      slug: 'stable',
    });

    await expect(service.update(1, {})).resolves.toMatchObject({
      name: 'Stable',
    });
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('updates a tag after checking name and slug uniqueness', async () => {
    repository.findOne.mockResolvedValue({ id: 1, name: 'Old', slug: 'old' });
    const nameQuery = queryBuilder(null);
    const slugQuery = queryBuilder(null);
    repository.createQueryBuilder
      .mockReturnValueOnce(nameQuery)
      .mockReturnValueOnce(slugQuery);

    await expect(
      service.update(1, { name: 'New Name' }),
    ).resolves.toMatchObject({
      name: 'New Name',
      slug: 'new-name',
    });
    expect(nameQuery.andWhere).toHaveBeenCalledWith('tag.id != :tagId', {
      tagId: 1,
    });
    expect(slugQuery.where).toHaveBeenCalledWith('tag.slug = :slug', {
      slug: 'new-name',
    });
  });

  it('filters with clamped pagination and search', async () => {
    const builder = queryBuilder();
    repository.createQueryBuilder.mockReturnValue(builder);

    await expect(
      service.filterAndPagination({
        page: 0,
        limit: 0,
        search: 'heart',
        arrange: 'asc',
      }),
    ).resolves.toEqual({
      tags: [{ id: 1 }],
      total: 1,
      page: 1,
      totalPages: 1,
      limit: 1,
    });
    expect(builder.skip).toHaveBeenCalledWith(0);
    expect(builder.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
  });

  it('throws for a missing tag and only soft-deletes an existing one', async () => {
    repository.findOne.mockResolvedValueOnce(null);
    await expect(service.findById(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repository.findOne.mockResolvedValueOnce({ id: 1 });
    await expect(service.remove(1)).resolves.toHaveProperty('message');
    expect(repository.softDelete).toHaveBeenCalledWith(1);
  });
});
