import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageType } from 'src/shared/enums/messageType';
import { MessagesService } from 'src/modules/messages/messages.service';

describe('MessagesService authorization', () => {
  let messageRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let channelsService: { isChannelExists: jest.Mock };
  let websocketGateway: { server: { to: jest.Mock } };
  let moduleRef: { get: jest.Mock };
  let emit: jest.Mock;
  let service: MessagesService;

  beforeEach(() => {
    messageRepo = {
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue({ id: 5 }),
      findOne: jest.fn(),
    };
    channelsService = {
      isChannelExists: jest.fn().mockResolvedValue(true),
    };
    emit = jest.fn();
    websocketGateway = {
      server: { to: jest.fn().mockReturnValue({ emit }) },
    };
    moduleRef = { get: jest.fn().mockReturnValue(websocketGateway) };
    service = new MessagesService(
      messageRepo as never,
      {} as never,
      channelsService as never,
      {} as never,
      moduleRef as never,
    );
    jest
      .spyOn(service, 'getMessageByMessageId')
      .mockResolvedValue({ id: 5, channel: { id: 12 } } as never);
  });

  it('uses the authenticated user as sender instead of sender_id', async () => {
    await service.saveMessage(
      {
        message_type: MessageType.REGULAR,
        sender_id: 999,
        channel_id: 12,
      },
      7,
    );

    expect(channelsService.isChannelExists).toHaveBeenCalledWith(7, 12);
    expect(messageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: { id: 7 },
        channel: { id: 12 },
      }),
    );
  });

  it('broadcasts the saved message to the channel room over the websocket gateway', async () => {
    const message = await service.saveMessage(
      {
        message_type: MessageType.REGULAR,
        sender_id: 7,
        channel_id: 12,
      },
      7,
    );

    expect(websocketGateway.server.to).toHaveBeenCalledWith('room:12');
    expect(emit).toHaveBeenCalledWith('receive:message', message);
  });

  it('rejects sending to a channel the user does not belong to', async () => {
    channelsService.isChannelExists.mockResolvedValue(false);

    await expect(
      service.saveMessage(
        {
          message_type: MessageType.REGULAR,
          sender_id: 7,
          channel_id: 12,
        },
        7,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(messageRepo.save).not.toHaveBeenCalled();
  });
});

describe('MessagesService.assertMessageSender', () => {
  let messageRepo: { findOne: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    messageRepo = { findOne: jest.fn() };
    service = new MessagesService(
      messageRepo as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('rejects when the message does not exist', async () => {
    messageRepo.findOne.mockResolvedValue(null);
    await expect(service.assertMessageSender(7, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects a non-sender attaching a file to someone else's message (IDOR)", async () => {
    messageRepo.findOne.mockResolvedValue({ id: 99, sender: { id: 12 } });
    await expect(service.assertMessageSender(7, 99)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows the real sender', async () => {
    messageRepo.findOne.mockResolvedValue({ id: 99, sender: { id: 7 } });
    await expect(service.assertMessageSender(7, 99)).resolves.toBeUndefined();
  });
});

describe('MessagesService.markChannelMessagesAsRead', () => {
  let messageRepo: { createQueryBuilder: jest.Mock };
  let qb: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };
  let channelsService: { isChannelExists: jest.Mock };
  let service: MessagesService;

  beforeEach(() => {
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 3 }),
    };
    messageRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    channelsService = { isChannelExists: jest.fn().mockResolvedValue(true) };
    service = new MessagesService(
      messageRepo as never,
      {} as never,
      channelsService as never,
      {} as never,
      {} as never,
    );
  });

  it('rejects marking as read for a non-member', async () => {
    channelsService.isChannelExists.mockResolvedValue(false);

    await expect(
      service.markChannelMessagesAsRead(12, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(messageRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("marks only the other participant's unread messages as read", async () => {
    const result = await service.markChannelMessagesAsRead(12, 7);

    expect(channelsService.isChannelExists).toHaveBeenCalledWith(7, 12);
    expect(qb.set).toHaveBeenCalledWith({ is_read: true });
    expect(qb.where).toHaveBeenCalledWith('channel_id = :channelId', {
      channelId: 12,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('sender_id != :userId', {
      userId: 7,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('is_read = false');
    expect(result).toEqual({ updated: 3 });
  });
});
