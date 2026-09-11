import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { ComplaintsController } from 'src/modules/complaints/complaints.controller';

describe('ComplaintsController', () => {
  const complaintsService = {
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdForRequester: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new ComplaintsController(complaintsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists complaints with filters and pagination', () => {
    const filters = { page: 1 } as never;
    const expected = { items: [] };
    complaintsService.filterAndPagination.mockReturnValue(expected);

    const result = controller.filterAndPagination(filters);

    expect(complaintsService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toBe(expected);
  });

  it("scopes 'my complaints' to the authenticated user, overriding any userId filter", () => {
    const expected = { items: [] };
    complaintsService.filterAndPagination.mockReturnValue(expected);

    const result = controller.myComplaints(
      { user: { userId: 7 } } as never,
      { page: 1, userId: 999 } as never,
    );

    expect(complaintsService.filterAndPagination).toHaveBeenCalledWith({
      page: 1,
      userId: 7,
    });
    expect(result).toBe(expected);
  });

  it('creates a complaint for the authenticated caller', () => {
    const expected = { id: 1 };
    complaintsService.create.mockReturnValue(expected);

    const result = controller.create({ user: { userId: 7 } } as never, {
      content: 'issue',
    } as never);

    expect(complaintsService.create).toHaveBeenCalledWith(7, {
      content: 'issue',
    });
    expect(result).toBe(expected);
  });

  it("ignores any userId provided in the create body, always using the authenticated caller (IDOR)", () => {
    const expected = { id: 1 };
    complaintsService.create.mockReturnValue(expected);

    const result = controller.create({ user: { userId: 7 } } as never, {
      content: 'issue',
      userId: 42,
    } as never);

    expect(complaintsService.create).toHaveBeenCalledWith(7, {
      content: 'issue',
      userId: 42,
    });
    expect(result).toBe(expected);
  });

  it('finds a complaint by id, scoped to the authenticated caller', () => {
    const expected = { id: 3 };
    complaintsService.findByIdForRequester.mockReturnValue(expected);

    const result = controller.findById(
      { user: { userId: 7, roles: ['PATIENT'] } } as never,
      3,
    );

    expect(complaintsService.findByIdForRequester).toHaveBeenCalledWith(
      3,
      7,
      ['PATIENT'],
    );
    expect(result).toBe(expected);
  });

  it('updates a complaint', () => {
    const body = { status: 'RESOLVED' } as never;
    const expected = { id: 3 };
    complaintsService.update.mockReturnValue(expected);

    const result = controller.update(3, body);

    expect(complaintsService.update).toHaveBeenCalledWith(3, body);
    expect(result).toBe(expected);
  });

  it('removes a complaint', () => {
    const expected = { message: 'removed' };
    complaintsService.remove.mockReturnValue(expected);

    const result = controller.remove(3);

    expect(complaintsService.remove).toHaveBeenCalledWith(3);
    expect(result).toBe(expected);
  });
});

describe('ComplaintsController authorization metadata', () => {
  it.each([
    ['filterAndPagination', PERMISSIONS.COMPLAINT_MANAGE],
    ['myComplaints', PERMISSIONS.COMPLAINT_READ],
    ['create', PERMISSIONS.COMPLAINT_CREATE],
    ['findById', PERMISSIONS.COMPLAINT_READ],
    ['update', PERMISSIONS.COMPLAINT_UPDATE],
    ['remove', PERMISSIONS.COMPLAINT_DELETE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        ComplaintsController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
