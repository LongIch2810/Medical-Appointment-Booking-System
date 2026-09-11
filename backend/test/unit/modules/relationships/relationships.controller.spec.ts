import { RelationshipsController } from 'src/modules/relationships/relationships.controller';

describe('RelationshipsController', () => {
  const relationshipsService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    getRelationshipDetail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new RelationshipsController(
    relationshipsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFilterRelationships', () => {
    it('delegates to relationshipsService.filterAndPagination and returns its result', async () => {
      const filters = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      relationshipsService.filterAndPagination.mockResolvedValue(expected);

      const result = await controller.getFilterRelationships(filters);

      expect(relationshipsService.filterAndPagination).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toBe(expected);
    });
  });

  describe('createRelationship', () => {
    it('delegates to relationshipsService.create with the request body', async () => {
      const body = { name: 'Parent' } as never;
      const expected = { relationshipCode: 'PARENT' };
      relationshipsService.create.mockResolvedValue(expected);

      const result = await controller.createRelationship(body);

      expect(relationshipsService.create).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('getRelationshipDetail', () => {
    it('delegates to relationshipsService.getRelationshipDetail with the code param', async () => {
      const expected = { relationshipCode: 'PARENT' };
      relationshipsService.getRelationshipDetail.mockResolvedValue(expected);

      const result = await controller.getRelationshipDetail('PARENT');

      expect(
        relationshipsService.getRelationshipDetail,
      ).toHaveBeenCalledWith('PARENT');
      expect(result).toBe(expected);
    });
  });

  describe('updateRelationship', () => {
    it('delegates to relationshipsService.update with the code param and body', async () => {
      const body = { name: 'Guardian' } as never;
      const expected = { relationshipCode: 'PARENT', name: 'Guardian' };
      relationshipsService.update.mockResolvedValue(expected);

      const result = await controller.updateRelationship('PARENT', body);

      expect(relationshipsService.update).toHaveBeenCalledWith(
        'PARENT',
        body,
      );
      expect(result).toBe(expected);
    });
  });

  describe('deleteRelationship', () => {
    it('delegates to relationshipsService.remove with the code param', async () => {
      const expected = { message: 'deleted' };
      relationshipsService.remove.mockResolvedValue(expected);

      const result = await controller.deleteRelationship('PARENT');

      expect(relationshipsService.remove).toHaveBeenCalledWith('PARENT');
      expect(result).toBe(expected);
    });
  });
});
