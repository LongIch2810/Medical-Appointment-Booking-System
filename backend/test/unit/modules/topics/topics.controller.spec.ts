import { TopicsController } from 'src/modules/topics/topics.controller';

describe('TopicsController', () => {
  const topicsService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new TopicsController(topicsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopics', () => {
    it('delegates to topicsService.filterAndPagination with the request body', async () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      topicsService.filterAndPagination.mockResolvedValue(expected);

      const result = await controller.getTopics(body);

      expect(topicsService.filterAndPagination).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('createTopic', () => {
    it('delegates to topicsService.create with the request body', async () => {
      const body = { name: 'Cardiology basics' } as never;
      const expected = { topicId: 1, name: 'Cardiology basics' };
      topicsService.create.mockResolvedValue(expected);

      const result = await controller.createTopic(body);

      expect(topicsService.create).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('getTopicDetail', () => {
    it('delegates to topicsService.findById with the topicId param', async () => {
      const expected = { topicId: 1, name: 'Cardiology basics' };
      topicsService.findById.mockResolvedValue(expected);

      const result = await controller.getTopicDetail(1);

      expect(topicsService.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('updateTopic', () => {
    it('delegates to topicsService.update with topicId and body', async () => {
      const body = { name: 'Updated topic' } as never;
      const expected = { topicId: 1, name: 'Updated topic' };
      topicsService.update.mockResolvedValue(expected);

      const result = await controller.updateTopic(1, body);

      expect(topicsService.update).toHaveBeenCalledWith(1, body);
      expect(result).toBe(expected);
    });
  });

  describe('deleteTopic', () => {
    it('delegates to topicsService.remove with the topicId param', async () => {
      const expected = { message: 'deleted' };
      topicsService.remove.mockResolvedValue(expected);

      const result = await controller.deleteTopic(1);

      expect(topicsService.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});
