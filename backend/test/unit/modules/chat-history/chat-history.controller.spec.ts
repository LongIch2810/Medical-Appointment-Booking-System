import { ForbiddenException } from '@nestjs/common';
import { RoleMessage } from 'src/shared/enums/roleMessage';
import { ChatHistoryController } from 'src/modules/chat-history/chat-history.controller';

describe('ChatHistoryController authorization', () => {
  const chatHistoryService = {
    saveMessage: jest.fn(),
    getChatHistoryContext: jest.fn(),
    getChatHistory: jest.fn(),
  };
  const controller = new ChatHistoryController(chatHistoryService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores a caller-supplied userId when saving history', async () => {
    await controller.saveMessage({ user: { userId: 7 } }, {
      userId: 999,
      role: RoleMessage.HUMAN,
      content: 'hello',
    } as never);

    expect(chatHistoryService.saveMessage).toHaveBeenCalledWith(
      7,
      RoleMessage.HUMAN,
      'hello',
    );
  });

  it("rejects access to another user's context", async () => {
    await expect(
      controller.getChatHistoryContext({ user: { userId: 7 } }, 999),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(chatHistoryService.getChatHistoryContext).not.toHaveBeenCalled();
  });

  it("rejects access to another user's paginated history", () => {
    expect(() =>
      controller.getChatHistory({ user: { userId: 7 } }, 999, 1),
    ).toThrow(ForbiddenException);
    expect(chatHistoryService.getChatHistory).not.toHaveBeenCalled();
  });
});
