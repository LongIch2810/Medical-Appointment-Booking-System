import { RelativesController } from 'src/modules/relatives/relatives.controller';

describe('RelativesController', () => {
  const relativesService = {
    create: jest.fn(),
    findRelativesByUserId: jest.fn(),
    getRelativeDetail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    filterAndPagination: jest.fn(),
  };
  const controller = new RelativesController(relativesService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRelative', () => {
    it('creates a relative for the authenticated user', () => {
      const body = { fullName: 'Jane Doe' } as never;
      const expected = { relativeId: 1 };
      relativesService.create.mockReturnValue(expected);

      const result = controller.createRelative(
        { user: { userId: 7 } } as never,
        body,
      );

      expect(relativesService.create).toHaveBeenCalledWith(7, body);
      expect(result).toBe(expected);
    });
  });

  describe('findRelatives', () => {
    it('normalizes query params and delegates to findRelativesByUserId', () => {
      const expected = { data: [], total: 0 };
      relativesService.findRelativesByUserId.mockReturnValue(expected);

      const result = controller.findRelatives(
        { user: { userId: 7 } } as never,
        {
          page: '2',
          limit: '5',
          search: 'John',
          relationshipCode: 'PARENT',
          arrange: 'asc',
        },
      );

      expect(relativesService.findRelativesByUserId).toHaveBeenCalledWith(7, {
        page: 2,
        limit: 5,
        search: 'John',
        relationshipCode: 'PARENT',
        arrange: 'asc',
      });
      expect(result).toBe(expected);
    });

    it('falls back to defaults when query params are missing', () => {
      relativesService.findRelativesByUserId.mockReturnValue({
        data: [],
        total: 0,
      });

      controller.findRelatives({ user: { userId: 7 } } as never, {});

      expect(relativesService.findRelativesByUserId).toHaveBeenCalledWith(7, {
        page: 1,
        limit: 10,
        search: undefined,
        relationshipCode: undefined,
        arrange: 'desc',
      });
    });

    it('falls back to the legacy name/relationship_code query keys', () => {
      relativesService.findRelativesByUserId.mockReturnValue({
        data: [],
        total: 0,
      });

      controller.findRelatives({ user: { userId: 7 } } as never, {
        name: 'Legacy Name',
        relationship_code: 'CHILD',
        arrange: 'invalid',
      });

      expect(relativesService.findRelativesByUserId).toHaveBeenCalledWith(7, {
        page: 1,
        limit: 10,
        search: 'Legacy Name',
        relationshipCode: 'CHILD',
        arrange: 'desc',
      });
    });
  });

  describe('getRelativeDetail', () => {
    it('delegates to relativesService.getRelativeDetail with userId and relativeId', async () => {
      const expected = { relativeId: 1 };
      relativesService.getRelativeDetail.mockResolvedValue(expected);

      const result = await controller.getRelativeDetail(
        { user: { userId: 7 } } as never,
        1,
      );

      expect(relativesService.getRelativeDetail).toHaveBeenCalledWith(7, 1);
      expect(result).toBe(expected);
    });
  });

  describe('updateRelative', () => {
    it('delegates to relativesService.update with userId, relativeId and body', async () => {
      const body = { fullName: 'Jane Updated' } as never;
      const expected = { relativeId: 1, fullName: 'Jane Updated' };
      relativesService.update.mockResolvedValue(expected);

      const result = await controller.updateRelative(
        { user: { userId: 7 } } as never,
        1,
        body,
      );

      expect(relativesService.update).toHaveBeenCalledWith(7, 1, body);
      expect(result).toBe(expected);
    });
  });

  describe('deleteRelative', () => {
    it('delegates to relativesService.remove with userId and relativeId', async () => {
      const expected = { message: 'deleted' };
      relativesService.remove.mockResolvedValue(expected);

      const result = await controller.deleteRelative(
        { user: { userId: 7 } } as never,
        1,
      );

      expect(relativesService.remove).toHaveBeenCalledWith(7, 1);
      expect(result).toBe(expected);
    });
  });

  describe('findAdminRelatives', () => {
    it('delegates to relativesService.filterAndPagination with the request body', () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      relativesService.filterAndPagination.mockReturnValue(expected);

      const result = controller.findAdminRelatives(body);

      expect(relativesService.filterAndPagination).toHaveBeenCalledWith(
        body,
      );
      expect(result).toBe(expected);
    });
  });
});
