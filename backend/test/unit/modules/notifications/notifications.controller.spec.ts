import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { NotificationsController } from 'src/modules/notifications/notifications.controller';

describe('NotificationsController', () => {
  const notificationsService = {
    findMine: jest.fn(),
    unreadCount: jest.fn(),
    markMineAsRead: jest.fn(),
    markAllMineAsRead: jest.fn(),
    findRecipients: jest.fn(),
    filterAndPagination: jest.fn(),
    create: jest.fn(),
    sendBroadcast: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new NotificationsController(
    notificationsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the authenticated account's notifications", () => {
    const filters = { page: 1 } as never;
    const expected = { items: [] };
    notificationsService.findMine.mockReturnValue(expected);

    const result = controller.findMine(
      { user: { userId: 7 } } as never,
      filters,
    );

    expect(notificationsService.findMine).toHaveBeenCalledWith(7, filters);
    expect(result).toBe(expected);
  });

  it("gets the authenticated account's unread notification count", () => {
    const expected = { count: 2 };
    notificationsService.unreadCount.mockReturnValue(expected);

    const result = controller.unreadCount({
      user: { userId: 7 },
    } as never);

    expect(notificationsService.unreadCount).toHaveBeenCalledWith(7);
    expect(result).toBe(expected);
  });

  it('marks a single notification as read for the authenticated account', () => {
    const expected = { id: 3 };
    notificationsService.markMineAsRead.mockReturnValue(expected);

    const result = controller.markMineAsRead(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(notificationsService.markMineAsRead).toHaveBeenCalledWith(7, 3);
    expect(result).toBe(expected);
  });

  it('marks all notifications as read for the authenticated account', () => {
    const expected = { updated: 5 };
    notificationsService.markAllMineAsRead.mockReturnValue(expected);

    const result = controller.markAllMineAsRead({
      user: { userId: 7 },
    } as never);

    expect(notificationsService.markAllMineAsRead).toHaveBeenCalledWith(7);
    expect(result).toBe(expected);
  });

  it('lists eligible notification recipients', () => {
    const filters = { role: 'doctor' } as never;
    const expected = { items: [] };
    notificationsService.findRecipients.mockReturnValue(expected);

    const result = controller.findRecipients(filters);

    expect(notificationsService.findRecipients).toHaveBeenCalledWith(filters);
    expect(result).toBe(expected);
  });

  it('lists notifications with filters and pagination', () => {
    const filters = { page: 1 } as never;
    const expected = { items: [] };
    notificationsService.filterAndPagination.mockReturnValue(expected);

    const result = controller.filterAndPagination(filters);

    expect(notificationsService.filterAndPagination).toHaveBeenCalledWith(
      filters,
    );
    expect(result).toBe(expected);
  });

  it('creates a manual notification', () => {
    const body = { title: 'Hi' } as never;
    const expected = { id: 1 };
    notificationsService.create.mockReturnValue(expected);

    const result = controller.create(body);

    expect(notificationsService.create).toHaveBeenCalledWith(body);
    expect(result).toBe(expected);
  });

  it('sends a broadcast notification', () => {
    const body = { audience: 'ROLE', roleName: 'DOCTOR' } as never;
    const expected = { targetedCount: 3 };
    notificationsService.sendBroadcast.mockReturnValue(expected);

    const result = controller.sendBroadcast(body);

    expect(notificationsService.sendBroadcast).toHaveBeenCalledWith(body);
    expect(result).toBe(expected);
  });

  it('finds a notification by id', () => {
    const expected = { id: 3 };
    notificationsService.findById.mockReturnValue(expected);

    const result = controller.findById(3);

    expect(notificationsService.findById).toHaveBeenCalledWith(3);
    expect(result).toBe(expected);
  });

  it('updates a notification', () => {
    const body = { title: 'Updated' } as never;
    const expected = { id: 3 };
    notificationsService.update.mockReturnValue(expected);

    const result = controller.update(3, body);

    expect(notificationsService.update).toHaveBeenCalledWith(3, body);
    expect(result).toBe(expected);
  });

  it('removes a notification', () => {
    const expected = { message: 'removed' };
    notificationsService.remove.mockReturnValue(expected);

    const result = controller.remove(3);

    expect(notificationsService.remove).toHaveBeenCalledWith(3);
    expect(result).toBe(expected);
  });
});

describe('NotificationsController authorization metadata', () => {
  it.each([
    ['findMine', PERMISSIONS.NOTIFICATION_READ],
    ['unreadCount', PERMISSIONS.NOTIFICATION_READ],
    ['markMineAsRead', PERMISSIONS.NOTIFICATION_READ],
    ['markAllMineAsRead', PERMISSIONS.NOTIFICATION_READ],
    ['findRecipients', PERMISSIONS.NOTIFICATION_CREATE],
    ['filterAndPagination', PERMISSIONS.NOTIFICATION_MANAGE],
    ['create', PERMISSIONS.NOTIFICATION_CREATE],
    ['sendBroadcast', PERMISSIONS.NOTIFICATION_SEND],
    ['findById', PERMISSIONS.NOTIFICATION_MANAGE],
    ['update', PERMISSIONS.NOTIFICATION_UPDATE],
    ['remove', PERMISSIONS.NOTIFICATION_DELETE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        NotificationsController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
