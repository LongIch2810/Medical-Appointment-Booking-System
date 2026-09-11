import { TagsController } from 'src/modules/tags/tags.controller';

describe('TagsController', () => {
  const tagsService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new TagsController(tagsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTags', () => {
    it('delegates to tagsService.filterAndPagination with the request body', async () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      tagsService.filterAndPagination.mockResolvedValue(expected);

      const result = await controller.getTags(body);

      expect(tagsService.filterAndPagination).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('createTag', () => {
    it('delegates to tagsService.create with the request body', async () => {
      const body = { name: 'Urgent' } as never;
      const expected = { tagId: 1, name: 'Urgent' };
      tagsService.create.mockResolvedValue(expected);

      const result = await controller.createTag(body);

      expect(tagsService.create).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('getTagDetail', () => {
    it('delegates to tagsService.findById with the tagId param', async () => {
      const expected = { tagId: 1, name: 'Urgent' };
      tagsService.findById.mockResolvedValue(expected);

      const result = await controller.getTagDetail(1);

      expect(tagsService.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('updateTag', () => {
    it('delegates to tagsService.update with tagId and body', async () => {
      const body = { name: 'Low priority' } as never;
      const expected = { tagId: 1, name: 'Low priority' };
      tagsService.update.mockResolvedValue(expected);

      const result = await controller.updateTag(1, body);

      expect(tagsService.update).toHaveBeenCalledWith(1, body);
      expect(result).toBe(expected);
    });
  });

  describe('deleteTag', () => {
    it('delegates to tagsService.remove with the tagId param', async () => {
      const expected = { message: 'deleted' };
      tagsService.remove.mockResolvedValue(expected);

      const result = await controller.deleteTag(1);

      expect(tagsService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});
