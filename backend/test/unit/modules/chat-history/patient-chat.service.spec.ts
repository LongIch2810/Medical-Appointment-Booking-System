import { HttpException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import AiHealthRoadmap from 'src/entities/aiHealthRoadmap.entity';
import Conversation from 'src/entities/conversation.entity';
import PatientChatConversation from 'src/entities/patientChatConversation.entity';
import PatientChatMessage from 'src/entities/patientChatMessage.entity';
import Relative from 'src/entities/relative.entity';
import { ChatHistoryService } from 'src/modules/chat-history/chat-history.service';
import { UsersService } from 'src/modules/users/users.service';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { AiDocumentStorageService } from 'src/modules/ai-documents/ai-document-storage.service';

describe('ChatHistoryService patient conversations', () => {
  let service: ChatHistoryService;
  let patientConversationRepo: Record<string, jest.Mock>;
  let patientMessageRepo: Record<string, jest.Mock>;
  let axiosPostSpy: jest.SpyInstance;
  let axiosDeleteSpy: jest.SpyInstance;

  const conversation = {
    id: 24,
    title: 'Đặt lịch khám',
    user: { id: 9 },
    created_at: new Date('2026-09-20T10:00:00Z'),
    updated_at: new Date('2026-09-20T10:00:00Z'),
    deleted_at: null,
  };

  beforeEach(async () => {
    patientConversationRepo = {
      findOne: jest.fn().mockResolvedValue(conversation),
      save: jest.fn().mockImplementation(async (value) => ({
        ...conversation,
        ...value,
      })),
      findAndCount: jest.fn().mockResolvedValue([[conversation], 1]),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    patientMessageRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation(async (value) => ({
        id: value.role === 'USER' ? 1 : 2,
        created_at: new Date('2026-09-20T10:01:00Z'),
        ...value,
      })),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(Conversation), useValue: {} },
        { provide: getRepositoryToken(AiHealthRoadmap), useValue: {} },
        { provide: getRepositoryToken(Relative), useValue: {} },
        {
          provide: getRepositoryToken(PatientChatConversation),
          useValue: patientConversationRepo,
        },
        {
          provide: getRepositoryToken(PatientChatMessage),
          useValue: patientMessageRepo,
        },
        { provide: AiDocumentStorageService, useValue: {} },
        {
          provide: UsersService,
          useValue: { findByUserId: jest.fn().mockResolvedValue({ id: 9 }) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'http://chatbot:5000'),
            getOrThrow: jest.fn(() => 'internal-key'),
          },
        },
        {
          provide: RedisCacheService,
          useValue: { getData: jest.fn(), setData: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ChatHistoryService);
    axiosPostSpy = jest.spyOn(axios, 'post');
    axiosDeleteSpy = jest.spyOn(axios, 'delete');
  });

  afterEach(() => jest.restoreAllMocks());

  it('creates and paginates only the current user conversations', async () => {
    await expect(
      service.createPatientChatConversation(9),
    ).resolves.toMatchObject({
      id: 24,
      title: 'Cuộc trò chuyện mới',
    });
    expect(patientConversationRepo.save).toHaveBeenCalledWith({
      user: { id: 9 },
      title: 'Cuộc trò chuyện mới',
    });

    const result = await service.listPatientChatConversations(9, 2, 99);
    expect(result).toMatchObject({
      total: 1,
      page: 2,
      limit: 50,
      totalPages: 1,
    });
    expect(patientConversationRepo.findAndCount).toHaveBeenCalledWith({
      where: { user: { id: 9 } },
      order: { updated_at: 'DESC' },
      skip: 50,
      take: 50,
    });
  });

  it('refuses a conversation not owned by the requested user', async () => {
    patientConversationRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getPatientChatConversation(8, 24),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(patientMessageRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('deletes the matching LangGraph thread before soft deleting the owned conversation', async () => {
    axiosDeleteSpy.mockResolvedValue({ data: { success: true } });
    await service.deletePatientChatConversation(9, 24, 'user-token');
    expect(axiosDeleteSpy).toHaveBeenCalledWith(
      'http://chatbot:5000/chatbot/patient-chat/conversations/24',
      expect.objectContaining({
        data: { userId: 9 },
        headers: expect.objectContaining({
          Authorization: 'Bearer user-token',
        }),
      }),
    );
    expect(patientConversationRepo.softDelete).toHaveBeenCalledWith(24);
  });

  it('stores a user message before the chatbot request and retains it on upstream timeout', async () => {
    const timeout = Object.assign(new Error('timed out'), {
      isAxiosError: true,
      code: 'ECONNABORTED',
    });
    axiosPostSpy.mockRejectedValue(timeout);

    let caught: unknown;
    try {
      await service.sendPatientChatMessage(9, 24, 'user-token', {
        message: 'Tôi muốn đặt lịch',
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(504);
    expect(patientMessageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'USER',
        content: 'Tôi muốn đặt lịch',
        conversation: expect.objectContaining({ id: 24 }),
      }),
    );
    expect(axiosPostSpy).toHaveBeenCalledWith(
      'http://chatbot:5000/chatbot/patient-chat',
      expect.objectContaining({
        userId: 9,
        conversationId: 24,
        threadId: 'patient-chat:v1:9:24',
        mode: 'MESSAGE',
        message: 'Tôi muốn đặt lịch',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer user-token',
        }),
      }),
    );
  });

  it('rejects a stale approval instead of resuming the graph', async () => {
    patientMessageRepo.findOne.mockResolvedValue({
      id: 31,
      role: 'ASSISTANT',
      action: 'BOOKING_APPROVAL',
      payload: {
        operationId: '4d7f8c38-b3a4-47a0-9cb3-2d7a48ed98e8',
        bookingSummary: {},
      },
    });
    let caught: unknown;
    try {
      await service.sendPatientChatMessage(9, 24, 'user-token', {
        approvalMessageId: 30,
        decision: 'APPROVE',
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(409);
    expect(axiosPostSpy).not.toHaveBeenCalled();
  });
});
