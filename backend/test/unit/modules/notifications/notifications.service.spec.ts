/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import Notification from 'src/entities/notification.entity';
import User from 'src/entities/user.entity';
import { NotificationType } from 'src/shared/enums/notificationType';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

const createQueryBuilderMock = () => {
  const query = {
    select: jest.fn(),
    innerJoin: jest.fn(),
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    distinct: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    execute: jest.fn(),
    getOne: jest.fn(),
    getRawMany: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  Object.keys(query).forEach((key) => {
    if (!['execute', 'getOne', 'getRawMany', 'getManyAndCount'].includes(key)) {
      query[key as keyof typeof query].mockReturnValue(query);
    }
  });
  return query;
};

function notificationEntity(
  id: number,
  userId: number,
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id,
    title: 'Tiêu đề',
    content: 'Nội dung',
    type: NotificationType.MANUAL,
    is_read: false,
    action_url: null,
    metadata: {},
    user: { id: userId, fullname: 'Người dùng', email: 'user@example.com' },
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    deleted_at: null as unknown as Date,
    ...overrides,
  } as Notification;
}

describe('NotificationsService', () => {
  let notificationRepo: jest.Mocked<Repository<Notification>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let gateway: jest.Mocked<WebsocketGateway>;
  let redisCacheService: { getData: jest.Mock; setData: jest.Mock };
  let service: NotificationsService;

  beforeEach(() => {
    notificationRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Notification>>;
    userRepo = {
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;
    gateway = {
      notifyNotificationNew: jest.fn(),
      notifyNotificationUpdated: jest.fn(),
      notifyNotificationDeleted: jest.fn(),
      notifyNotificationsReadAll: jest.fn(),
    } as unknown as jest.Mocked<WebsocketGateway>;
    redisCacheService = {
      getData: jest.fn().mockResolvedValue(null),
      setData: jest.fn(),
    };
    service = new NotificationsService(
      notificationRepo,
      userRepo,
      gateway,
      redisCacheService as never,
    );
  });

  it('chỉ đánh dấu thông báo thuộc về chính user và emit bản cập nhật', async () => {
    const entity = notificationEntity(8, 21);
    notificationRepo.findOne.mockResolvedValue(entity);
    notificationRepo.save.mockResolvedValue(entity);

    const result = await service.markMineAsRead(21, 8);

    expect(notificationRepo.findOne).toHaveBeenCalledWith({
      where: { id: 8, user: { id: 21 } },
      relations: ['user'],
    });
    expect(entity.is_read).toBe(true);
    expect(result.isRead).toBe(true);
    expect(gateway.notifyNotificationUpdated).toHaveBeenCalledWith(
      21,
      expect.objectContaining({ id: 8, isRead: true }),
    );

    notificationRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.markMineAsRead(22, 8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('đếm chưa đọc và đánh dấu tất cả theo user hiện tại', async () => {
    notificationRepo.count.mockResolvedValue(4);
    const query = createQueryBuilderMock();
    query.execute.mockResolvedValue({ affected: 4 });
    notificationRepo.createQueryBuilder.mockReturnValue(query as never);

    await expect(service.unreadCount(12)).resolves.toEqual({ count: 4 });
    await expect(service.markAllMineAsRead(12)).resolves.toEqual({
      unreadCount: 0,
    });

    expect(notificationRepo.count).toHaveBeenCalledWith({
      where: { user: { id: 12 }, is_read: false },
    });
    expect(query.where).toHaveBeenCalledWith('user_id = :userId', {
      userId: 12,
    });
    expect(gateway.notifyNotificationsReadAll).toHaveBeenCalledWith(12);
  });

  it('soft-delete rồi emit đúng user sở hữu', async () => {
    notificationRepo.findOne.mockResolvedValue(notificationEntity(9, 31));

    await expect(service.remove(9)).resolves.toEqual({
      message: 'Xóa thông báo thành công.',
    });

    expect(notificationRepo.softDelete).toHaveBeenCalledWith(9);
    expect(gateway.notifyNotificationDeleted).toHaveBeenCalledWith(31, 9);
  });

  it('gửi thủ công phải lưu DB trước rồi mới emit room user', async () => {
    const recipientQuery = createQueryBuilderMock();
    recipientQuery.getOne.mockResolvedValue({ id: 42 });
    userRepo.createQueryBuilder.mockReturnValue(recipientQuery as never);
    notificationRepo.create.mockImplementation(
      (value) => value as Notification,
    );
    (notificationRepo.save as jest.Mock).mockImplementation((value) => {
      const drafts = value as Notification[];
      return Promise.resolve(
        drafts.map((draft, index) => ({ ...draft, id: index + 100 })),
      );
    });
    notificationRepo.find.mockResolvedValue([notificationEntity(100, 42)]);

    const result = await service.create({
      title: 'Bảo trì',
      content: 'Hệ thống sẽ bảo trì.',
      userId: 42,
    });

    expect(notificationRepo.save).toHaveBeenCalled();
    expect(gateway.notifyNotificationNew).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ id: 100, isRead: false }),
    );
    expect(notificationRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      gateway.notifyNotificationNew.mock.invocationCallOrder[0],
    );
    expect(result.type).toBe(NotificationType.MANUAL);
    expect(
      recipientQuery.andWhere.mock.calls.some(([condition]) =>
        String(condition).includes('role.role_name IN'),
      ),
    ).toBe(false);
  });

  it('paginates active recipients from every role', async () => {
    const recipientsQuery = createQueryBuilderMock();
    recipientsQuery.getManyAndCount.mockResolvedValue([
      [
        {
          id: 7,
          fullname: 'Bác sĩ An',
          email: 'doctor@example.com',
          username: 'doctor.an',
          is_active: true,
          is_locking: false,
          roles: [{ role: { id: 3, role_name: 'DOCTOR' } }],
        },
      ],
      1,
    ]);
    userRepo.createQueryBuilder.mockReturnValue(recipientsQuery as never);

    const result = await service.findRecipients({
      page: 2,
      limit: 10,
      search: 'doctor@example.com',
    });

    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.users).toHaveLength(1);
    expect(result.users[0].roles[0].role_name).toBe('DOCTOR');
    expect(recipientsQuery.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('recipient.email ILIKE :search'),
      { search: '%doctor@example.com%' },
    );
    expect(recipientsQuery.skip).toHaveBeenCalledWith(10);
    expect(recipientsQuery.take).toHaveBeenCalledWith(10);
  });

  it('tạo thông báo lịch cho patient và toàn bộ admin, không trùng user', async () => {
    const adminQuery = createQueryBuilderMock();
    adminQuery.getRawMany.mockResolvedValue([
      { id: '7' },
      { id: '8' },
      { id: '7' },
    ]);
    userRepo.createQueryBuilder.mockReturnValue(adminQuery as never);
    notificationRepo.create.mockImplementation(
      (value) => value as Notification,
    );
    (notificationRepo.save as jest.Mock).mockImplementation((value) => {
      const drafts = value as Notification[];
      return Promise.resolve(
        drafts.map((draft, index) => ({ ...draft, id: index + 1 })),
      );
    });
    notificationRepo.find.mockResolvedValue([
      notificationEntity(1, 7, { type: NotificationType.APPOINTMENT_CREATED }),
      notificationEntity(2, 8, { type: NotificationType.APPOINTMENT_CREATED }),
      notificationEntity(3, 9, { type: NotificationType.APPOINTMENT_CREATED }),
    ]);

    await service.createAppointmentNotifications(
      NotificationType.APPOINTMENT_CREATED,
      {
        appointmentId: 15,
        patientUserId: 7,
        doctorUserId: 9,
        patientName: 'An',
        doctorName: 'Bình',
        appointmentDate: '2026-09-02',
        startTime: '08:00:00',
        endTime: '09:00:00',
        status: 'PENDING',
      },
    );

    const savedDrafts = notificationRepo.save.mock
      .calls[0][0] as Notification[];
    expect(savedDrafts).toHaveLength(3);
    expect(savedDrafts.map((draft) => draft.user.id)).toEqual([7, 9, 8]);
    expect(savedDrafts.every((draft) => draft.is_read === false)).toBe(true);
    expect(gateway.notifyNotificationNew).toHaveBeenCalledTimes(3);
  });

  it('filterAndPagination áp dụng đúng bộ lọc admin và trả về danh sách đã map', async () => {
    const query = createQueryBuilderMock();
    query.getManyAndCount.mockResolvedValue([
      [notificationEntity(1, 21), notificationEntity(2, 22)],
      2,
    ]);
    notificationRepo.createQueryBuilder.mockReturnValue(query as never);

    const result = await service.filterAndPagination({
      page: 1,
      limit: 10,
      arrange: 'desc',
      userId: 21,
      isRead: false,
    } as never);

    expect(query.andWhere).toHaveBeenCalledWith('user.id = :userId', {
      userId: 21,
    });
    expect(query.andWhere).toHaveBeenCalledWith('notification.is_read = :isRead', {
      isRead: false,
    });
    expect(result.total).toBe(2);
    expect(result.notifications).toHaveLength(2);
  });

  it('findMine chỉ lọc theo user_id của chính người gọi, không lộ thông báo người khác', async () => {
    const query = createQueryBuilderMock();
    query.getManyAndCount.mockResolvedValue([[notificationEntity(5, 21)], 1]);
    notificationRepo.createQueryBuilder.mockReturnValue(query as never);

    const result = await service.findMine(21, { page: 1, limit: 20 } as never);

    expect(query.where).toHaveBeenCalledWith('notification.user_id = :userId', {
      userId: 21,
    });
    expect(result.notifications).toHaveLength(1);
  });

  it('findById trả về thông báo đã map, throw NotFoundException khi không tồn tại', async () => {
    notificationRepo.findOne.mockResolvedValue(notificationEntity(3, 21));

    const result = await service.findById(3);
    expect(result.id).toBe(3);

    notificationRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update chỉ ghi các field thực sự được truyền và emit cập nhật cho đúng user', async () => {
    const entity = notificationEntity(4, 21, { title: 'Cũ', content: 'Cũ' });
    notificationRepo.findOne.mockResolvedValue(entity);
    notificationRepo.save.mockResolvedValue({ ...entity, title: 'Mới' });

    const result = await service.update(4, { title: 'Mới' } as never);

    expect(entity.title).toBe('Mới');
    expect(entity.content).toBe('Cũ');
    expect(result.title).toBe('Mới');
    expect(gateway.notifyNotificationUpdated).toHaveBeenCalledWith(
      21,
      expect.objectContaining({ id: 4 }),
    );
  });

  it('createAppointmentReminder gửi đúng nội dung nhắc lịch cho patient', async () => {
    notificationRepo.create.mockImplementation(
      (value) => value as Notification,
    );
    (notificationRepo.save as jest.Mock).mockImplementation((value) => {
      const drafts = value as Notification[];
      return Promise.resolve(
        drafts.map((draft, index) => ({ ...draft, id: index + 200 })),
      );
    });
    notificationRepo.find.mockResolvedValue([
      notificationEntity(200, 7, {
        type: NotificationType.APPOINTMENT_REMINDER,
      }),
    ]);

    await service.createAppointmentReminder({
      appointmentId: 15,
      patientUserId: 7,
      doctorUserId: 9,
      patientName: 'An',
      doctorName: 'Bình',
      appointmentDate: '2026-09-02',
      startTime: '08:00:00',
      endTime: '09:00:00',
      status: 'CONFIRMED',
    });

    const savedDrafts = notificationRepo.save.mock
      .calls[0][0] as Notification[];
    expect(savedDrafts).toHaveLength(1);
    expect(savedDrafts[0].user.id).toBe(7);
    expect(savedDrafts[0].content).toContain('08:00 - 09:00');
    expect(savedDrafts[0].dedupe_key).toBe(
      'appointment-reminder:15:7',
    );
  });
});
