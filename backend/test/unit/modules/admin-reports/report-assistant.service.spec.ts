import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import axios from 'axios';
import AiReportConversation from 'src/entities/aiReportConversation.entity';
import AiReportMessage from 'src/entities/aiReportMessage.entity';
import { AdminReportsService } from 'src/modules/admin-reports/admin-reports.service';

jest.mock('axios');

describe('AdminReportsService report assistant', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const conversation = {
    id: 22,
    title: 'Report question',
    created_at: new Date('2026-08-01T00:00:00Z'),
    updated_at: new Date('2026-08-01T00:00:00Z'),
  } as AiReportConversation;

  function setup() {
    const assistantSaved = {
      id: 31,
      conversation,
      role: 'ASSISTANT',
      action: 'ANSWER',
      content: 'Here is what the available data supports.',
      plan: null,
      report: null,
      created_at: new Date('2026-08-01T00:02:00Z'),
    } as AiReportMessage;
    const managerMessageRepo = {
      save: jest.fn().mockResolvedValue(assistantSaved),
    };
    const managerConversationRepo = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    const managerReportRepo = { save: jest.fn() };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === AiReportMessage) return managerMessageRepo;
        if (entity === AiReportConversation) return managerConversationRepo;
        return managerReportRepo;
      }),
    };
    const reportRepo = {
      manager: {
        transaction: jest.fn(async (callback: (manager: unknown) => unknown) =>
          callback(manager),
        ),
      },
    };
    const conversationRepo = {
      save: jest.fn().mockResolvedValue(conversation),
      findOne: jest.fn().mockResolvedValue(conversation),
      findAndCount: jest.fn().mockResolvedValue([[conversation], 1]),
      update: jest.fn(),
    };
    const priorMessages = Array.from({ length: 12 }, (_, index) => ({
      id: 29 - index,
      role: index % 2 === 0 ? 'ASSISTANT' : 'USER',
      action: index % 2 === 0 ? 'ANSWER' : null,
      content: `message-${29 - index}:${'x'.repeat(1_200)}`,
      plan: null,
      created_at: new Date(
        `2026-08-01T00:${String(index).padStart(2, '0')}:00Z`,
      ),
    })) as AiReportMessage[];
    const messageRepo = {
      save: jest.fn().mockResolvedValue({
        id: 30,
        conversation,
        role: 'USER',
        action: null,
        content: 'Follow-up',
        plan: null,
        created_at: new Date('2026-08-01T00:01:00Z'),
      } as AiReportMessage),
      find: jest.fn().mockResolvedValue(priorMessages),
      findOne: jest.fn().mockResolvedValue(assistantSaved),
    };
    const config = {
      get: jest.fn((key: string) =>
        key === 'CHATBOT_URL' ? 'http://chatbot.test' : undefined,
      ),
      getOrThrow: jest.fn(() => 'internal-secret'),
    };
    const service = new AdminReportsService(
      config as unknown as ConfigService,
      reportRepo as never,
      { deleteAsset: jest.fn() } as never,
      conversationRepo as never,
      messageRepo as never,
    );
    return {
      service,
      reportRepo,
      conversationRepo,
      messageRepo,
      managerMessageRepo,
      managerConversationRepo,
      priorMessages,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('scopes conversation reads by owner and clamps list pagination', async () => {
    const { service, conversationRepo } = setup();

    await service.listAssistantConversations(9, Number.NaN, 500);

    const listed = await service.listAssistantConversations(9);
    expect(listed.conversations[0].createdAt).toBe('2026-08-01T00:00:00.000Z');
    expect(listed.conversations[0].updatedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(conversationRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdBy: { id: 9 } },
        skip: 0,
        take: 50,
      }),
    );
    conversationRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.getAssistantConversation(9, 22)).rejects.toMatchObject(
      {
        status: 404,
        response: expect.objectContaining({
          code: 'REPORT_CONVERSATION_NOT_FOUND',
        }),
      },
    );
  });

  it('returns the stable invalid-input code for empty, oversized, and mixed request bodies', async () => {
    const { service } = setup();
    const invalidInput = {
      status: 400,
      response: expect.objectContaining({
        code: 'REPORT_ASSISTANT_INVALID_INPUT',
      }),
    };

    await expect(
      service.createAssistantConversation(9, 'token', { message: '   ' }),
    ).rejects.toMatchObject(invalidInput);
    await expect(
      service.createAssistantConversation(9, 'token', {
        message: 'x'.repeat(4_001),
      }),
    ).rejects.toMatchObject(invalidInput);
    await expect(
      service.sendAssistantMessage(9, 'token', 22, {
        message: 'Follow-up',
        confirmPlanMessageId: 17,
      }),
    ).rejects.toMatchObject(invalidInput);
  });

  it('forwards the access token and bounds context to 12 messages/12,000 characters', async () => {
    const { service, messageRepo, conversationRepo } = setup();
    mockedAxios.post.mockResolvedValue({
      data: {
        data: { action: 'ANSWER', message: 'Here is what the data supports.' },
      },
    } as never);

    await service.sendAssistantMessage(9, 'real-user-jwt', 22, {
      message: 'Follow-up',
    });

    const [url, body, config] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('http://chatbot.test/chatbot/report-assistant');
    expect(body).toEqual(
      expect.objectContaining({
        userId: 9,
        conversationId: 22,
        turnId: 30,
        threadId: 'report-assistant:v1:9:22',
        mode: 'MESSAGE',
        message: 'Follow-up',
      }),
    );
    expect(config?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer real-user-jwt',
        'x-chatbot-internal-key': 'internal-secret',
      }),
    );
    const history = (body as { historySeed: Array<{ content: string }> })
      .historySeed;
    expect(history.length).toBeLessThanOrEqual(12);
    expect(
      history.reduce((total, item) => total + item.content.length, 0),
    ).toBeLessThanOrEqual(12_000);
    expect(history[history.length - 1].content).toContain('message-29:');
    expect(history.some((item) => item.content.includes('message-18:'))).toBe(
      false,
    );
    expect(messageRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
      mockedAxios.post.mock.invocationCallOrder[0],
    );
    expect(conversationRepo.update.mock.invocationCallOrder[0]).toBeLessThan(
      mockedAxios.post.mock.invocationCallOrder[0],
    );
  });

  it('rejects a stale confirmation before making an upstream call', async () => {
    const { service, conversationRepo, messageRepo } = setup();
    const plan = {
      schemaVersion: 1,
      title: 'Report',
      objective: 'Objective',
      query: 'A sufficiently detailed query',
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
      metrics: ['count'],
      groupBy: [],
      sourceViews: ['chatbot_report_appointments_view'],
    };
    messageRepo.findOne
      .mockResolvedValueOnce({
        id: 17,
        conversation,
        role: 'ASSISTANT',
        action: 'PROPOSE_PLAN',
        plan,
      } as unknown as AiReportMessage)
      .mockResolvedValueOnce({ id: 18 } as AiReportMessage);

    await expect(
      service.sendAssistantMessage(9, 'token', 22, {
        confirmPlanMessageId: 17,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(conversationRepo.findOne).toHaveBeenCalledWith({
      where: { id: 22, createdBy: { id: 9 } },
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('allows retrying a failed explicit confirmation without accepting a stale plan', async () => {
    const { service, messageRepo } = setup();
    const plan = {
      schemaVersion: 1,
      title: 'Report',
      objective: 'Objective',
      query: 'A sufficiently detailed query',
      fromDate: '2026-08-01',
      toDate: '2026-08-31',
      metrics: ['count'],
      groupBy: [],
      sourceViews: ['chatbot_report_appointments_view'],
    };
    const planMessage = {
      id: 17,
      conversation,
      role: 'ASSISTANT',
      action: 'PROPOSE_PLAN',
      plan,
    } as unknown as AiReportMessage;
    const confirmationMessage = {
      id: 18,
      conversation,
      role: 'USER',
      action: null,
      content: 'Xác nhận tạo báo cáo theo kế hoạch #17.',
      plan: null,
      created_at: new Date('2026-08-01T00:01:00Z'),
    } as AiReportMessage;
    messageRepo.findOne
      .mockResolvedValueOnce(planMessage)
      .mockResolvedValueOnce(planMessage)
      .mockResolvedValueOnce(planMessage)
      .mockResolvedValueOnce(confirmationMessage)
      .mockResolvedValueOnce({
        id: 31,
        conversation,
        role: 'ASSISTANT',
        action: 'GENERATE_REPORT',
        content: 'Report generated.',
        plan: null,
        report: null,
        created_at: new Date(),
      } as AiReportMessage);
    messageRepo.save.mockResolvedValueOnce(confirmationMessage);
    mockedAxios.post
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 502 } })
      .mockResolvedValueOnce({
        data: { data: { action: 'ANSWER', message: 'Report generated.' } },
      } as never);

    await expect(
      service.sendAssistantMessage(9, 'token', 22, {
        confirmPlanMessageId: 17,
      }),
    ).rejects.toMatchObject({ status: 502 });
    await service.sendAssistantMessage(9, 'token', 22, {
      confirmPlanMessageId: 17,
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(messageRepo.save).toHaveBeenCalledTimes(1);
  });

  it('maps chatbot report-assistant rate limits to the stable public code', async () => {
    const { service } = setup();
    mockedAxios.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 429, data: { code: 'CHATBOT_RATE_LIMITED' } },
      config: { headers: { Authorization: 'Bearer should-not-be-logged' } },
    });

    try {
      await service.sendAssistantMessage(9, 'real-user-jwt', 22, {
        message: 'Follow-up',
      });
      throw new Error('expected rate limit');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({
        code: 'CHATBOT_RATE_LIMITED',
      });
      expect(
        JSON.stringify((error as HttpException).getResponse()),
      ).not.toContain('real-user-jwt');
    }
  });
});
