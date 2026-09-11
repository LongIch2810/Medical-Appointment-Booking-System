import { SatisfactionRatingController } from 'src/modules/satisfaction-rating/satisfaction-rating.controller';

describe('SatisfactionRatingController', () => {
  const satisfactionRatingService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const controller = new SatisfactionRatingController(
    satisfactionRatingService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSatisfactionRatings', () => {
    it('delegates to satisfactionRatingService.filterAndPagination with the request body', async () => {
      const body = { page: 1, limit: 10 } as never;
      const expected = { data: [], total: 0 };
      satisfactionRatingService.filterAndPagination.mockResolvedValue(
        expected,
      );

      const result = await controller.getSatisfactionRatings(body);

      expect(
        satisfactionRatingService.filterAndPagination,
      ).toHaveBeenCalledWith(body);
      expect(result).toBe(expected);
    });
  });

  describe('createSatisfactionRating', () => {
    it('creates a rating for the authenticated user', async () => {
      const body = { score: 5 } as never;
      const expected = { ratingId: 1, score: 5 };
      satisfactionRatingService.create.mockResolvedValue(expected);

      const result = await controller.createSatisfactionRating(
        { user: { userId: 7 } } as never,
        body,
      );

      expect(satisfactionRatingService.create).toHaveBeenCalledWith(7, body);
      expect(result).toBe(expected);
    });
  });

  describe('getSatisfactionRatingDetail', () => {
    it('delegates to satisfactionRatingService.findById with the ratingId param and the authenticated caller', async () => {
      const expected = { ratingId: 1, score: 5 };
      satisfactionRatingService.findById.mockResolvedValue(expected);

      const result = await controller.getSatisfactionRatingDetail(
        { user: { userId: 7, roles: ['PATIENT'] } } as never,
        1,
      );

      expect(satisfactionRatingService.findById).toHaveBeenCalledWith(
        1,
        7,
        ['PATIENT'],
      );
      expect(result).toBe(expected);
    });
  });

  describe('updateSatisfactionRating', () => {
    it('delegates to satisfactionRatingService.update with ratingId, body and the authenticated caller', async () => {
      const body = { score: 4 } as never;
      const expected = { ratingId: 1, score: 4 };
      satisfactionRatingService.update.mockResolvedValue(expected);

      const result = await controller.updateSatisfactionRating(
        { user: { userId: 7, roles: ['PATIENT'] } } as never,
        1,
        body,
      );

      expect(satisfactionRatingService.update).toHaveBeenCalledWith(
        1,
        body,
        7,
        ['PATIENT'],
      );
      expect(result).toBe(expected);
    });
  });
});
