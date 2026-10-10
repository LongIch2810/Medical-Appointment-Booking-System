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
import PatientChatConversation from 'src/entities/patientChatConversation.entity';
import PatientChatMessage from 'src/entities/patientChatMessage.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let usersService: { findByUserId: jest.Mock };
  let postSpy: jest.SpyInstance;
  let configGet: jest.Mock;
  let patientConversationRepo: Record<string, jest.Mock>;
  let patientMessageRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    usersService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 9 }),
    };
    configGet = jest.fn((key: string) =>
      key === 'CHATBOT_URL' ? 'http://chatbot:5000' : undefined,
    );
    const patientConversation = {
      id: 22,
      title: 'Cuộc trò chuyện mới',
      user: { id: 9 },
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };
    patientConversationRepo = {
      findOne: jest.fn().mockResolvedValue(patientConversation),
      save: jest.fn().mockResolvedValue(patientConversation),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    patientMessageRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockImplementation(async () => [
        {
          id: 1,
          role: 'USER',
          content: 'Nên uống bao nhiêu nước?',
          action: null,
          payload: null,
          turn_id: 'turn-id',
          created_at: new Date(),
        },
      ]),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation(async (message) => ({
        id: message.role === 'USER' ? 1 : 2,
        ...message,
        created_at: new Date(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(Conversation), useValue: {} },
        {
          provide: getRepositoryToken(PatientChatConversation),
          useValue: patientConversationRepo,
        },
        {
          provide: getRepositoryToken(PatientChatMessage),
          useValue: patientMessageRepo,
        },
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

  describe('chatbotAnswer', () => {
    it('routes the legacy chat helper through the patient conversation flow', async () => {
      postSpy.mockResolvedValue({
        data: { data: { action: 'ANSWER', message: 'Uống đủ nước mỗi ngày.' } },
      });

      await expect(
        service.chatbotAnswer(9, 'Nên uống bao nhiêu nước?', 'access-token'),
      ).resolves.toBe('Uống đủ nước mỗi ngày.');
      expect(postSpy).toHaveBeenCalledWith(
        'http://chatbot:5000/chatbot/patient-chat',
        expect.objectContaining({
          userId: 9,
          conversationId: 22,
          threadId: 'patient-chat:v1:9:22',
          mode: 'MESSAGE',
          message: 'Nên uống bao nhiêu nước?',
          historySeed: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Nên uống bao nhiêu nước?',
            }),
          ]),
        }),
        {
          headers: {
            'x-chatbot-internal-key': 'test-internal-key',
            Authorization: 'Bearer access-token',
          },
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
        expect((error as HttpException).getResponse()).toMatchObject({
          code: 'PATIENT_CHAT_TIMEOUT',
        });
      }
    });
  });
});
