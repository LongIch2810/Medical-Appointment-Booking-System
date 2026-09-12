import {
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import Conversation from 'src/entities/conversation.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let usersService: { findByUserId: jest.Mock };
  let postSpy: jest.SpyInstance;
  let configGet: jest.Mock;

  beforeEach(async () => {
    usersService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 9 }),
    };
    configGet = jest.fn((key: string) =>
      key === 'CHATBOT_URL' ? 'http://chatbot:5000' : undefined,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(Conversation), useValue: {} },
        { provide: UsersService, useValue: usersService },
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
            getOrThrow: jest.fn((key: string) =>
              key === 'CHATBOT_INTERNAL_KEY' ? 'test-internal-key' : undefined,
            ),
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            getData: jest.fn(),
            setData: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(ChatHistoryService);
    postSpy = jest.spyOn(axios, 'post');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the selected relative and token to chatbot and returns its result', async () => {
    const result = {
      pdfUrl: 'https://res.cloudinary.com/example/roadmap.pdf',
      raw: { relative_id: 7 },
    };
    postSpy.mockResolvedValue({
      data: { success: true, data: result },
    });

    await expect(
      service.buildHealthRoadmap(9, 7, 'access-token'),
    ).resolves.toEqual(result);
    expect(postSpy).toHaveBeenCalledWith(
      'http://chatbot:5000/chatbot/build-health-roadmap',
      { relative_id: 7, token: 'access-token' },
      {
        headers: {
          'x-chatbot-internal-key': 'test-internal-key',
        },
        timeout: expect.any(Number),
      },
    );
  });

  it('rejects when the authenticated user no longer exists', async () => {
    usersService.findByUserId.mockResolvedValue(null);

    await expect(
      service.buildHealthRoadmap(9, 7, 'access-token'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('rejects a request without an access token', async () => {
    await expect(service.buildHealthRoadmap(9, 7, '')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('maps a chatbot 401 to UnauthorizedException', async () => {
    postSpy.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Unauthorized' } },
    });

    await expect(
      service.buildHealthRoadmap(9, 7, 'expired-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('maps a chatbot request timeout to a stable 504 response', async () => {
    postSpy.mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 240000ms exceeded',
    });

    try {
      await service.buildHealthRoadmap(9, 7, 'access-token');
      throw new Error('Expected buildHealthRoadmap to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(504);
      expect((error as HttpException).getResponse()).toEqual({
        code: 'CHATBOT_HEALTH_ROADMAP_TIMEOUT',
        message: 'AI chưa phản hồi sau 5 lần thử. Vui lòng thử lại sau.',
      });
    }
  });

  it('preserves downstream status and message for health-profile failures', async () => {
    postSpy.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: { err: 'Không tìm thấy hồ sơ sức khỏe.' },
      },
    });

    try {
      await service.buildHealthRoadmap(9, 999, 'access-token');
      throw new Error('Expected buildHealthRoadmap to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(404);
      expect((error as HttpException).getResponse()).toEqual({
        code: 'CHATBOT_HEALTH_ROADMAP_FAILED',
        message: 'Không tìm thấy hồ sơ sức khỏe.',
      });
    }
  });

  describe('chatbotAnswer', () => {
    it('sends an explicit timeout and returns the chatbot answer', async () => {
      postSpy.mockResolvedValue({ data: { answer: 'Uống đủ nước mỗi ngày.' } });

      await expect(
        service.chatbotAnswer(9, 'Nên uống bao nhiêu nước?', 'access-token'),
      ).resolves.toBe('Uống đủ nước mỗi ngày.');
      expect(postSpy).toHaveBeenCalledWith(
        'http://chatbot:5000/chatbot/chat',
        {
          question: 'Nên uống bao nhiêu nước?',
          userId: 9,
          token: 'access-token',
        },
        {
          headers: { 'x-chatbot-internal-key': 'test-internal-key' },
          timeout: expect.any(Number),
        },
      );
    });

    it('rejects when the authenticated user no longer exists', async () => {
      usersService.findByUserId.mockResolvedValue(null);
      await expect(
        service.chatbotAnswer(9, 'question', 'access-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('rejects a request without an access token', async () => {
      await expect(
        service.chatbotAnswer(9, 'question', ''),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('maps a chatbot 401 to UnauthorizedException', async () => {
      postSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
      });
      await expect(
        service.chatbotAnswer(9, 'question', 'expired-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('maps a chatbot request timeout to a stable 504 response', async () => {
      postSpy.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      try {
        await service.chatbotAnswer(9, 'question', 'access-token');
        throw new Error('Expected chatbotAnswer to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(504);
        expect((error as HttpException).getResponse()).toEqual({
          code: 'CHATBOT_CHAT_TIMEOUT',
          message: 'Chatbot chưa phản hồi kịp thời. Vui lòng thử lại sau.',
        });
      }
    });
  });

  describe('summarizeMedicalRecord', () => {
    const imageUpload = {
      fieldName: 'images' as const,
      files: [
        {
          originalname: 'record.png',
          mimetype: 'image/png',
          buffer: Buffer.from('record-bytes'),
        } as Express.Multer.File,
      ],
    };

    it('forwards multipart data with the internal key and bearer token', async () => {
      postSpy.mockResolvedValue({ data: { data: '# Medical summary' } });

      await expect(
        service.summarizeMedicalRecord(9, 'access-token', imageUpload),
      ).resolves.toBe('# Medical summary');

      const [url, body, config] = postSpy.mock.calls[0];
      expect(url).toBe(
        'http://chatbot:5000/chatbot/upload/summary-medical-record',
      );
      expect(body).toBeInstanceOf(FormData);
      expect(config).toMatchObject({
        headers: {
          Authorization: 'Bearer access-token',
          'x-chatbot-internal-key': 'test-internal-key',
        },
        timeout: 120_000,
      });
    });

    it('maps downstream upload rejection and timeouts to stable responses', async () => {
      postSpy.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { message: 'Invalid PDF' } },
      });
      await expect(
        service.summarizeMedicalRecord(9, 'access-token', imageUpload),
      ).rejects.toMatchObject({ status: 400 });

      postSpy.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
      });
      await expect(
        service.summarizeMedicalRecord(9, 'access-token', imageUpload),
      ).rejects.toMatchObject({ status: 504 });
    });
  });
});
