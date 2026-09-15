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
import AiHealthRoadmap from 'src/entities/aiHealthRoadmap.entity';
import Relative from 'src/entities/relative.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AiDocumentStorageService } from 'src/modules/ai-documents/ai-document-storage.service';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let usersService: { findByUserId: jest.Mock };
  let postSpy: jest.SpyInstance;
  let configGet: jest.Mock;
  let roadmapRepo: { save: jest.Mock };
  let relativeRepo: { findOne: jest.Mock };
  let documentStorage: { deleteAsset: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 9 }),
    };
    configGet = jest.fn((key: string) =>
      key === 'CHATBOT_URL' ? 'http://chatbot:5000' : undefined,
    );
    roadmapRepo = { save: jest.fn() };
    relativeRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 7, fullname: 'Patient' }),
    };
    documentStorage = { deleteAsset: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(Conversation), useValue: {} },
        {
          provide: getRepositoryToken(AiHealthRoadmap),
          useValue: roadmapRepo,
        },
        { provide: getRepositoryToken(Relative), useValue: relativeRepo },
        { provide: AiDocumentStorageService, useValue: documentStorage },
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
    ).resolves.toEqual({
      ...result,
      fileName: expect.stringMatching(/\.pdf$/),
    });
    expect(postSpy).toHaveBeenCalledWith(
      'http://chatbot:5000/chatbot/build-health-roadmap',
      {
        relative_id: 7,
        token: 'access-token',
        fileName: expect.stringMatching(/\.pdf$/),
      },
      {
        headers: {
          'x-chatbot-internal-key': 'test-internal-key',
        },
        timeout: expect.any(Number),
      },
    );
  });

  it('persists a generated health roadmap for the authenticated user and relative', async () => {
    const asset = {
      publicId: 'ai-documents/results/roadmap',
      resourceType: 'raw',
      format: 'pdf',
      fileName: 'roadmap.pdf',
      bytes: 321,
    };
    postSpy.mockResolvedValue({ data: { data: { asset } } });
    roadmapRepo.save.mockImplementation(async (value) => ({
      ...value,
      id: 51,
      created_at: new Date('2026-09-14T00:00:00.000Z'),
    }));

    await expect(
      service.buildHealthRoadmap(9, 7, 'access-token'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 51,
        fileName: 'roadmap.pdf',
        pdfUrl: '/api/v1/health-roadmaps/51/file',
      }),
    );
    expect(roadmapRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 9 },
        relative: { id: 7 },
        output_asset: asset,
      }),
    );
  });

  it('returns a stable persistence error and deletes the uploaded roadmap when saving fails', async () => {
    const asset = {
      publicId: 'ai-documents/results/roadmap',
      resourceType: 'raw',
      format: 'pdf',
      fileName: 'roadmap.pdf',
      bytes: 321,
    };
    postSpy.mockResolvedValue({ data: { data: { asset } } });
    roadmapRepo.save.mockRejectedValue(new Error('insert failed'));

    try {
      await service.buildHealthRoadmap(9, 7, 'access-token');
      throw new Error('Expected buildHealthRoadmap to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getResponse()).toEqual({
        code: 'AI_HEALTH_ROADMAP_PERSISTENCE_FAILED',
        message:
          'Không thể lưu lộ trình sức khỏe lúc này. Vui lòng thử lại sau.',
      });
    }
    expect(documentStorage.deleteAsset).toHaveBeenCalledWith(asset);
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

  it.each([
    [
      429,
      { code: 'CHATBOT_RATE_LIMITED', message: 'Too many requests' },
      'CHATBOT_RATE_LIMITED',
      'Too many requests',
    ],
    [
      500,
      {
        error: {
          code: 'CHATBOT_INTERNAL_ERROR',
          details: 'Chatbot failed to generate the roadmap',
        },
      },
      'CHATBOT_INTERNAL_ERROR',
      'Chatbot failed to generate the roadmap',
    ],
  ])(
    'preserves chatbot %i status and error code',
    async (status, data, code, message) => {
      postSpy.mockRejectedValue({
        isAxiosError: true,
        response: { status, data },
      });

      try {
        await service.buildHealthRoadmap(9, 7, 'access-token');
        throw new Error('Expected buildHealthRoadmap to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(status);
        expect((error as HttpException).getResponse()).toEqual({
          code,
          message,
        });
      }
    },
  );

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

});
