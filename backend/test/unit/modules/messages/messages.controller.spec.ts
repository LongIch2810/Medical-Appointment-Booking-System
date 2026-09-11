import { PERMISSIONS, PERMISSIONS_KEY } from 'src/utils/constants';
import { MessagesController } from 'src/modules/messages/messages.controller';

describe('MessagesController', () => {
  const messagesService = {
    saveMessage: jest.fn(),
    getMessageByChannelId: jest.fn(),
    markChannelMessagesAsRead: jest.fn(),
  };
  const controller = new MessagesController(messagesService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves a message authored by the authenticated user', () => {
    const body = { channelId: 1, content: 'hi' } as never;
    const expected = { id: 1 };
    messagesService.saveMessage.mockReturnValue(expected);

    const result = controller.handleSaveMessage(
      { user: { userId: 7 } } as never,
      body,
    );

    expect(messagesService.saveMessage).toHaveBeenCalledWith(body, 7);
    expect(result).toBe(expected);
  });

  it('lists messages for a channel, scoped to the authenticated user', () => {
    const expected = { items: [] };
    messagesService.getMessageByChannelId.mockReturnValue(expected);

    const result = controller.getMessagesByChannelId(
      { user: { userId: 7 } } as never,
      3,
      { page: 2, limit: undefined } as never,
    );

    expect(messagesService.getMessageByChannelId).toHaveBeenCalledWith(
      3,
      7,
      2,
      undefined,
    );
    expect(result).toBe(expected);
  });

  it('marks a channel as read, scoped to the authenticated user', () => {
    const expected = { updated: 2 };
    messagesService.markChannelMessagesAsRead.mockReturnValue(expected);

    const result = controller.markChannelMessagesAsRead(
      { user: { userId: 7 } } as never,
      3,
    );

    expect(messagesService.markChannelMessagesAsRead).toHaveBeenCalledWith(
      3,
      7,
    );
    expect(result).toBe(expected);
  });
});

describe('MessagesController authorization metadata', () => {
  it.each([
    ['handleSaveMessage', PERMISSIONS.MESSAGE_CREATE],
    ['getMessagesByChannelId', PERMISSIONS.MESSAGE_READ],
    ['markChannelMessagesAsRead', PERMISSIONS.MESSAGE_UPDATE],
  ] as const)('requires %s permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        MessagesController.prototype[method],
      ),
    ).toEqual([permission]);
  });
});
