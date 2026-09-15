import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { ArticlesController } from 'src/modules/articles/articles.controller';

describe('ArticlesController', () => {
  const articlesService = {
    create: jest.fn(),
    updateArticle: jest.fn(),
    deleteArticle: jest.fn(),
    getArticle: jest.fn(),
    approveArticle: jest.fn(),
    filterAndPagination: jest.fn(),
    filterAndPaginationByDoctors: jest.fn(),
  };
  const controller = new ArticlesController(articlesService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an article for the authenticated user with uploaded files', async () => {
    const body = { title: 'Hello' } as never;
    const files = [{ originalname: 'a.png' }] as never;
    articlesService.create.mockResolvedValue({ message: 'created' });

    const result = await controller.createArticle(
      { user: { userId: 7 } } as never,
      body,
      files,
    );

    expect(articlesService.create).toHaveBeenCalledWith(7, body, files);
    expect(result).toEqual({ message: 'created' });
  });

  it('updates an article and returns the service message', async () => {
    const body = { title: 'Updated' } as never;
    articlesService.updateArticle.mockResolvedValue({
      message: 'updated',
    });

    const result = await controller.updateArticle(3, body);

    expect(articlesService.updateArticle).toHaveBeenCalledWith(3, body);
    expect(result).toBe('updated');
  });

  it('deletes an article and returns the service message', async () => {
    articlesService.deleteArticle.mockResolvedValue({ message: 'deleted' });

    const result = await controller.deleteArticle(3);

    expect(articlesService.deleteArticle).toHaveBeenCalledWith(3);
    expect(result).toBe('deleted');
  });

  it('gets an article detail', async () => {
    articlesService.getArticle.mockResolvedValue({ id: 3 });

    const result = await controller.getArticleDetail(3);

    expect(articlesService.getArticle).toHaveBeenCalledWith(3);
    expect(result).toEqual({ id: 3 });
  });

  it('approves an article and returns the service message', async () => {
    articlesService.approveArticle.mockResolvedValue({
      message: 'approved',
    });

    const result = await controller.approveArticle(3);

    expect(articlesService.approveArticle).toHaveBeenCalledWith(3);
    expect(result).toBe('approved');
  });

  it('lists articles with filters and pagination', async () => {
    const filters = { page: 1 } as never;
    articlesService.filterAndPagination.mockResolvedValue({ items: [] });

    const result = await controller.getArticles(filters);

    expect(articlesService.filterAndPagination).toHaveBeenCalledWith(filters);
    expect(result).toEqual({ items: [] });
  });

  it("lists only the authenticated doctor's own articles", async () => {
    const filters = { page: 1 } as never;
    articlesService.filterAndPaginationByDoctors.mockResolvedValue({
      items: [],
    });

    const result = await controller.getMyArticles(
      { user: { userId: 9 } } as never,
      filters,
    );

    expect(articlesService.filterAndPaginationByDoctors).toHaveBeenCalledWith(
      { page: 1, author_id: 9 },
    );
    expect(result).toEqual({ items: [] });
  });

  it('ignores any author_id the caller tries to smuggle in and forces their own userId', async () => {
    const filters = { page: 1, author_id: 999 } as never;
    articlesService.filterAndPaginationByDoctors.mockResolvedValue({
      items: [],
    });

    await controller.getMyArticles({ user: { userId: 9 } } as never, filters);

    expect(articlesService.filterAndPaginationByDoctors).toHaveBeenCalledWith(
      { page: 1, author_id: 9 },
    );
  });
});

describe('ArticlesController authorization metadata', () => {
  it.each([
    ['createArticle', PERMISSIONS.ARTICLE_CREATE],
    ['updateArticle', PERMISSIONS.ARTICLE_UPDATE],
    ['deleteArticle', PERMISSIONS.ARTICLE_DELETE],
    ['approveArticle', PERMISSIONS.ARTICLE_APPROVE],
    ['getMyArticles', PERMISSIONS.ARTICLE_READ],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, ArticlesController.prototype[method]),
    ).toEqual([permission]);
  });
});
