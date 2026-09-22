import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Conversation from 'src/entities/conversation.entity';
import { RoleMessage } from 'src/shared/enums/roleMessage';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import AiHealthRoadmap from 'src/entities/aiHealthRoadmap.entity';
import Relative from 'src/entities/relative.entity';
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';
import { AiDocumentStorageService } from '../ai-documents/ai-document-storage.service';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { buildHealthRoadmapFileName } from 'src/utils/aiDocumentFileName';
import { getDatabaseErrorMetadata } from 'src/utils/databaseErrorMetadata';
import { getChatbotUpstreamError } from 'src/utils/chatbotUpstreamError';
import PatientChatConversation from 'src/entities/patientChatConversation.entity';
import PatientChatMessage, {
  PatientChatAction,
} from 'src/entities/patientChatMessage.entity';
import { randomUUID } from 'node:crypto';

// Mọi call ra chatbot đều phải có timeout rõ ràng — trước đây axios dùng
// default (không timeout), request có thể treo vô thời hạn nếu chatbot
// không phản hồi.
// Chatbot service (Render free plan) tự spin-down sau ~15 phút không có
// traffic; cold-start phải load xong Qdrant/LangChain trước khi bind port,
// đo thực tế mất ~80-90s. 30s cũ luôn timeout ngay lần chat đầu sau khi
// service ngủ — nới lên 100s để chờ hết cold-start thay vì báo lỗi giả.
const CHATBOT_REQUEST_TIMEOUT_MS = 100_000;
const CHATBOT_KEEP_ALIVE_TIMEOUT_MS = 5_000;
const CHAT_HISTORY_CONTEXT_LIMIT = 10;
const CHAT_HISTORY_CACHE_TTL_SECONDS = 3_600;

type CachedChatMessage = {
  role: RoleMessage;
  content: string;
};

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
    @Optional()
    @InjectRepository(AiHealthRoadmap)
    private readonly roadmapRepo: Repository<AiHealthRoadmap>,
    @Optional()
    @InjectRepository(Relative)
    private readonly relativeRepo: Repository<Relative>,
    @Optional() private readonly documentStorage: AiDocumentStorageService,
    @InjectRepository(PatientChatConversation)
    private readonly patientChatConversationRepo: Repository<PatientChatConversation>,
    @InjectRepository(PatientChatMessage)
    private readonly patientChatMessageRepo: Repository<PatientChatMessage>,
  ) {}

  private async getOwnedPatientConversation(userId: number, id: number) {
    const conversation = await this.patientChatConversationRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!conversation)
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    return conversation;
  }

  async createPatientChatConversation(userId: number) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) throw new NotFoundException('Người dùng không tồn tại!');
    const conversation = await this.patientChatConversationRepo.save({
      user,
      title: 'Cuộc trò chuyện mới',
    });
    return this.mapPatientChatConversation(conversation);
  }

  async listPatientChatConversations(userId: number, page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(50, Math.max(1, limit));
    const [items, total] = await this.patientChatConversationRepo.findAndCount({
      where: { user: { id: userId } },
      order: { updated_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      conversations: items.map((item) => this.mapPatientChatConversation(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPatientChatConversation(
    userId: number,
    id: number,
    beforeMessageId?: number,
    limit = 50,
  ) {
    const conversation = await this.getOwnedPatientConversation(userId, id);
    limit = Math.min(100, Math.max(1, limit));
    const query = this.patientChatMessageRepo
      .createQueryBuilder('message')
      .where('message.conversation_id = :id', { id });
    if (beforeMessageId)
      query.andWhere('message.id < :beforeMessageId', { beforeMessageId });
    const rows = await query
      .orderBy('message.id', 'DESC')
      .take(limit + 1)
      .getMany();
    const hasMore = rows.length > limit;
    const messages = rows.slice(0, limit).reverse();
    return {
      conversation: this.mapPatientChatConversation(conversation),
      messages: messages.map((message) => this.mapPatientChatMessage(message)),
      hasMore,
      nextBeforeMessageId: hasMore ? (messages[0]?.id ?? null) : null,
    };
  }

  async deletePatientChatConversation(
    userId: number,
    id: number,
    token: string,
  ) {
    const conversation = await this.getOwnedPatientConversation(userId, id);
    try {
      await axios.delete(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/patient-chat/conversations/${id}`,
        {
          data: { userId },
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
            Authorization: `Bearer ${token}`,
          },
          timeout: CHATBOT_REQUEST_TIMEOUT_MS,
        },
      );
    } catch (error: any) {
      this.throwPatientChatUpstreamError(error);
    }
    await this.patientChatConversationRepo.softDelete(conversation.id);
    return { success: true };
  }

  async sendPatientChatMessage(
    userId: number,
    id: number,
    token: string,
    input: {
      message?: string;
      approvalMessageId?: number;
      decision?: 'APPROVE' | 'CANCEL';
    },
  ) {
    const conversation = await this.getOwnedPatientConversation(userId, id);
    const hasMessage = typeof input.message === 'string';
    const hasApproval = Number.isSafeInteger(input.approvalMessageId);
    if (hasMessage === hasApproval || (hasApproval && !input.decision)) {
      throw new HttpException(
        {
          code: 'PATIENT_CHAT_INVALID_INPUT',
          message: 'Yêu cầu gửi tin nhắn không hợp lệ.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const latest = await this.patientChatMessageRepo.findOne({
      where: { conversation: { id } },
      order: { id: 'DESC' },
    });
    let turnId: string = randomUUID();
    let userMessage: PatientChatMessage | null = null;
    let mode: 'MESSAGE' | 'RESUME_BOOKING' = 'MESSAGE';
    let decision: 'APPROVE' | 'REVISE' | 'CANCEL' | undefined;
    let approvalMessageId: number | undefined;
    let operationId: string | undefined;
    let bookingSummary: Record<string, unknown> | undefined;
    let message: string;

    if (hasApproval) {
      let approvalMessage: PatientChatMessage | null = null;
      if (
        latest &&
        latest.id === input.approvalMessageId &&
        latest.role === 'ASSISTANT' &&
        latest.action === 'BOOKING_APPROVAL'
      ) {
        approvalMessage = latest;
      } else if (
        latest?.role === 'USER' &&
        latest.payload?.approvalMessageId === input.approvalMessageId &&
        latest.payload?.decision === input.decision
      ) {
        // Retry the same approval after an upstream timeout without appending
        // another synthetic user message. Only the immediately preceding
        // approval may be retried; any later transcript entry makes it stale.
        approvalMessage = await this.patientChatMessageRepo.findOne({
          where: {
            id: input.approvalMessageId,
            conversation: { id },
            role: 'ASSISTANT',
            action: 'BOOKING_APPROVAL',
          },
        });
        if (approvalMessage) {
          userMessage = latest;
          turnId = latest.turn_id ?? turnId;
        }
      }
      if (!approvalMessage) {
        const status =
          latest?.action === 'BOOKING_APPROVAL'
            ? HttpStatus.CONFLICT
            : HttpStatus.NOT_FOUND;
        throw new HttpException(
          {
            code:
              status === HttpStatus.CONFLICT
                ? 'PATIENT_CHAT_ACTION_STALE'
                : 'PATIENT_CHAT_APPROVAL_NOT_FOUND',
            message: 'Yêu cầu xác nhận đặt lịch không còn hợp lệ.',
          },
          status,
        );
      }
      const savedOperationId = approvalMessage.payload?.operationId;
      const savedBookingSummary = approvalMessage.payload?.bookingSummary;
      if (
        typeof savedOperationId !== 'string' ||
        !savedBookingSummary ||
        typeof savedBookingSummary !== 'object'
      ) {
        throw new HttpException(
          {
            code: 'PATIENT_CHAT_ACTION_STALE',
            message: 'Yêu cầu xác nhận đặt lịch không còn hợp lệ.',
          },
          HttpStatus.CONFLICT,
        );
      }
      operationId = savedOperationId;
      bookingSummary = savedBookingSummary as Record<string, unknown>;
      decision = input.decision === 'APPROVE' ? 'APPROVE' : 'CANCEL';
      approvalMessageId = approvalMessage.id;
      mode = 'RESUME_BOOKING';
      message =
        decision === 'APPROVE' ? 'Xác nhận đặt lịch' : 'Hủy yêu cầu đặt lịch';
      if (!userMessage) {
        userMessage = await this.patientChatMessageRepo.save({
          conversation,
          role: 'USER',
          action: null,
          content: message,
          payload: { decision, approvalMessageId },
          appointment_id: null,
          turn_id: turnId,
        });
      }
    } else {
      message = input.message!.trim();
      if (!message || message.length > 4000) {
        throw new HttpException(
          {
            code: 'PATIENT_CHAT_INVALID_INPUT',
            message: 'Tin nhắn không hợp lệ hoặc quá dài.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        latest?.role === 'ASSISTANT' &&
        latest.action === 'BOOKING_APPROVAL'
      ) {
        if (
          typeof latest.payload?.operationId === 'string' &&
          latest.payload?.bookingSummary
        ) {
          mode = 'RESUME_BOOKING';
          decision = 'REVISE';
          approvalMessageId = latest.id;
          operationId = latest.payload.operationId;
          bookingSummary = latest.payload.bookingSummary as Record<
            string,
            unknown
          >;
        }
      }
      const firstUserMessage =
        (await this.patientChatMessageRepo.count({
          where: { conversation: { id }, role: 'USER' },
        })) === 0;
      userMessage = await this.patientChatMessageRepo.save({
        conversation,
        role: 'USER',
        action: null,
        content: message,
        payload: null,
        appointment_id: null,
        turn_id: turnId,
      });
      if (firstUserMessage) {
        conversation.title =
          message.replace(/\s+/g, ' ').trim().slice(0, 160) ||
          'Cuộc trò chuyện mới';
      }
    }

    await this.patientChatConversationRepo.update(id, {
      ...(userMessage &&
      (await this.patientChatMessageRepo.count({
        where: { conversation: { id }, role: 'USER' },
      })) === 1
        ? {
            title:
              userMessage.content.replace(/\s+/g, ' ').trim().slice(0, 160) ||
              'Cuộc trò chuyện mới',
          }
        : {}),
      updated_at: new Date(),
    });
    const historySeed = await this.buildPatientChatHistorySeed(id);
    let chatbotResponse: any;
    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/patient-chat`,
        {
          userId,
          conversationId: id,
          turnId,
          threadId: `patient-chat:v1:${userId}:${id}`,
          mode,
          ...(mode === 'MESSAGE' ? { message } : {}),
          ...(mode === 'RESUME_BOOKING' && decision === 'REVISE'
            ? { message }
            : {}),
          ...(decision ? { decision } : {}),
          ...(approvalMessageId ? { approvalMessageId } : {}),
          ...(operationId ? { operationId, bookingSummary } : {}),
          historySeed,
        },
        {
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
            Authorization: `Bearer ${token}`,
          },
          timeout: CHATBOT_REQUEST_TIMEOUT_MS,
        },
      );
      chatbotResponse = response.data?.data;
    } catch (error: any) {
      this.throwPatientChatUpstreamError(error);
    }
    const allowedActions: PatientChatAction[] = [
      'ANSWER',
      'CLARIFY',
      'BOOKING_APPROVAL',
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'MEMORY_RESULT',
      'REFUSE',
    ];
    if (
      !chatbotResponse ||
      typeof chatbotResponse.message !== 'string' ||
      !allowedActions.includes(chatbotResponse.action)
    ) {
      throw new HttpException(
        {
          code: 'PATIENT_CHAT_INVALID_RESPONSE',
          message: 'Chatbot trả về phản hồi không hợp lệ.',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
    const action = chatbotResponse.action as PatientChatAction;
    const appointmentId = Number.isSafeInteger(chatbotResponse.appointment?.id)
      ? chatbotResponse.appointment.id
      : null;
    const assistantMessage = await this.patientChatMessageRepo.save({
      conversation,
      role: 'ASSISTANT',
      action,
      content: chatbotResponse.message,
      payload: chatbotResponse.payload ?? null,
      appointment_id: appointmentId,
      turn_id: turnId,
    });
    await this.patientChatConversationRepo.update(id, {
      updated_at: new Date(),
    });
    return {
      conversation: this.mapPatientChatConversation({
        ...conversation,
        updated_at: new Date(),
      }),
      userMessage: userMessage ? this.mapPatientChatMessage(userMessage) : null,
      assistantMessage: this.mapPatientChatMessage(assistantMessage),
      appointment: chatbotResponse.appointment ?? null,
    };
  }

  private async buildPatientChatHistorySeed(conversationId: number) {
    const rows = await this.patientChatMessageRepo.find({
      where: { conversation: { id: conversationId } },
      order: { id: 'DESC' },
      take: 12,
    });
    const selected: Array<{
      role: 'user' | 'assistant';
      content: string;
      action?: string;
      payload?: unknown;
    }> = [];
    let characters = 0;
    for (const row of rows.reverse()) {
      const item = {
        role: row.role === 'USER' ? ('user' as const) : ('assistant' as const),
        content: row.content,
        ...(row.action ? { action: row.action } : {}),
        ...(row.payload ? { payload: row.payload } : {}),
      };
      const size =
        item.content.length + JSON.stringify(item.payload ?? '').length;
      if (characters + size > 12_000) break;
      characters += size;
      selected.push(item);
    }
    return selected;
  }

  private mapPatientChatConversation(conversation: PatientChatConversation) {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }

  private mapPatientChatMessage(message: PatientChatMessage) {
    return {
      id: message.id,
      role: message.role,
      action: message.action,
      content: message.content,
      payload: message.payload,
      appointmentId: message.appointment_id,
      turnId: message.turn_id,
      createdAt: message.created_at,
    };
  }

  private throwPatientChatUpstreamError(error: any): never {
    const upstream = getChatbotUpstreamError(error);
    if (upstream.status === 401) {
      throw new UnauthorizedException(
        'XÃ¡c thá»±c vá»›i trá»£ lÃ½ khÃ´ng há»£p lá»‡.',
      );
    }
    const status =
      axios.isAxiosError(error) &&
      (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
        ? HttpStatus.GATEWAY_TIMEOUT
        : upstream.status;
    const code =
      axios.isAxiosError(error) &&
      (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
        ? 'PATIENT_CHAT_TIMEOUT'
        : upstream.code || 'PATIENT_CHAT_FAILED';
    throw new HttpException(
      {
        code,
        message:
          upstream.message || 'Không thể nhận phản hồi từ trợ lý lúc này.',
      },
      status,
    );
  }

  private getChatHistoryCacheKey(userId: number) {
    return `chat_history_context:${userId}`;
  }

  private async refreshChatHistoryCache(
    userId: number,
    message: CachedChatMessage,
  ) {
    try {
      const cacheKey = this.getChatHistoryCacheKey(userId);
      const cached =
        await this.redisCacheService.getData<CachedChatMessage[]>(cacheKey);

      // The database query already includes the message just saved when the
      // cache is cold, so only prepend the message when the cache is warm.
      const history = cached
        ? [message, ...cached]
        : await this.loadChatHistoryContextFromDatabase(userId);

      await this.redisCacheService.setData(
        cacheKey,
        history.slice(0, CHAT_HISTORY_CONTEXT_LIMIT),
        CHAT_HISTORY_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      // Redis is an optimization; a cache outage must not break chat history.
      console.warn('Chat history cache refresh failed:', error);
    }
  }

  private async loadChatHistoryContextFromDatabase(
    userId: number,
  ): Promise<CachedChatMessage[]> {
    const history = await this.conversationRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      take: CHAT_HISTORY_CONTEXT_LIMIT,
    });

    return history.map(({ role, content }) => ({ role, content }));
  }

  // Chatbot service (Render free plan) tự spin-down sau ~15 phút không
  // traffic và cold-start mất ~80-90s, khiến tin nhắn chat đầu tiên sau
  // thời gian nghỉ luôn bị chờ lâu/timeout. Ping /healthy định kỳ để giữ
  // service "ấm" trong lúc site còn có người dùng hoạt động.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingChatbotKeepAlive() {
    try {
      await axios.get(
        `${this.configService.get<string>('CHATBOT_URL')}/healthy`,
        { timeout: CHATBOT_KEEP_ALIVE_TIMEOUT_MS },
      );
    } catch (error: any) {
      console.error('Chatbot keep-alive ping failed:', {
        status: error?.response?.status,
        code: error?.code,
      });
    }
  }

  async saveMessage(userId: number, role: RoleMessage, content: string) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    await this.conversationRepo.save({
      user,
      role,
      content,
    });
    await this.refreshChatHistoryCache(userId, { role, content });
  }

  async getChatHistoryContext(userId: number) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    try {
      const cached = await this.redisCacheService.getData<CachedChatMessage[]>(
        this.getChatHistoryCacheKey(userId),
      );
      if (cached) return cached;
    } catch (error) {
      console.warn('Chat history cache read failed:', error);
    }

    const history = await this.loadChatHistoryContextFromDatabase(userId);
    try {
      await this.redisCacheService.setData(
        this.getChatHistoryCacheKey(userId),
        history,
        CHAT_HISTORY_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      console.warn('Chat history cache warm-up failed:', error);
    }
    return history;
  }

  async chatbotAnswer(userId: number, question: string, token: string) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    if (!token) {
      throw new UnauthorizedException('Không có token xác thực.');
    }

    const conversation =
      (await this.patientChatConversationRepo.findOne({
        where: { user: { id: userId } },
        order: { updated_at: 'DESC' },
      })) ??
      (await this.patientChatConversationRepo.save({
        user: { id: userId },
        title: 'Cuộc trò chuyện mới',
      }));
    const result = await this.sendPatientChatMessage(
      userId,
      conversation.id,
      token,
      { message: question },
    );
    return result.assistantMessage.content;
  }

  async buildHealthRoadmap(userId: number, relativeId: number, token: string) {
    const relative = this.relativeRepo
      ? await this.relativeRepo.findOne({
          where: { id: relativeId, user: { id: userId } },
        })
      : null;
    if (this.relativeRepo && !relative) {
      throw new NotFoundException(
        'Hồ sơ người thân không thuộc tài khoản này.',
      );
    }

    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }

    if (!token) {
      throw new UnauthorizedException('Không có token xác thực.');
    }

    const outputFileName = buildHealthRoadmapFileName(relativeId);
    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/build-health-roadmap`,
        {
          relative_id: relativeId,
          token,
          fileName: outputFileName,
        },
        {
          headers: {
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
          },
          timeout: CHATBOT_REQUEST_TIMEOUT_MS,
        },
      );

      const data = response.data?.data as {
        asset?: AiDocumentAsset;
        title?: string;
        pdfUrl?: string;
        fileName?: string;
      };
      if (!data?.asset?.publicId && data?.pdfUrl) {
        return { ...data, fileName: data.fileName || outputFileName };
      }
      if (!data?.asset?.publicId) {
        throw new HttpException(
          'Chatbot không trả về tài liệu lộ trình hợp lệ.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      try {
        const saved = await this.roadmapRepo.save({
          user: { id: userId },
          relative: { id: relativeId },
          title:
            data.title ||
            `Lộ trình sức khỏe của ${relative?.fullname || 'hồ sơ'}`,
          output_asset: {
            ...data.asset,
            fileName: data.asset.fileName || outputFileName,
          },
        });
        return {
          id: saved.id,
          createdAt: saved.created_at,
          title: saved.title,
          fileName: saved.output_asset.fileName,
          pdfUrl: `/api/v1/health-roadmaps/${saved.id}/file`,
        };
      } catch (saveError) {
        if (this.documentStorage)
          await this.documentStorage
            .deleteAsset(data.asset)
            .catch(() => undefined);
        this.logger.error(
          JSON.stringify({
            scope: 'ai_health_roadmap',
            event: 'persistence_failed',
            userId,
            relativeId,
            ...getDatabaseErrorMetadata(saveError),
          }),
        );
        throw new HttpException(
          {
            code: 'AI_HEALTH_ROADMAP_PERSISTENCE_FAILED',
            message:
              'Không thể lưu lộ trình sức khỏe lúc này. Vui lòng thử lại sau.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      if (!axios.isAxiosError(error)) {
        throw new HttpException(
          {
            code: 'CHATBOT_HEALTH_ROADMAP_FAILED',
            message: 'Không thể tạo lộ trình sức khỏe từ chatbot.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const upstream = getChatbotUpstreamError(error);
      const status = upstream.status;

      if (
        status === 504 ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT'
      ) {
        throw new HttpException(
          {
            code: 'CHATBOT_HEALTH_ROADMAP_TIMEOUT',
            message: 'AI chưa phản hồi sau 5 lần thử. Vui lòng thử lại sau.',
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      if (status === 401) {
        throw new UnauthorizedException(
          'Token chatbot không hợp lệ hoặc đã hết hạn.',
        );
      }

      throw new HttpException(
        {
          code: upstream.code || 'CHATBOT_HEALTH_ROADMAP_FAILED',
          message:
            upstream.message || 'Không thể tạo lộ trình sức khỏe từ chatbot.',
        },
        status,
      );
    }
  }

  async getHealthRoadmapHistory(
    userId: number,
    page = 1,
    limit = 10,
    relativeId?: number,
  ) {
    page = Math.max(1, page);
    limit = Math.min(50, Math.max(1, limit));
    const query = this.roadmapRepo
      .createQueryBuilder('roadmap')
      .leftJoinAndSelect('roadmap.relative', 'relative')
      .where('roadmap.user_id = :userId', { userId });
    if (relativeId)
      query.andWhere('roadmap.relative_id = :relativeId', { relativeId });
    const [rows, total] = await Promise.all([
      query
        .clone()
        .orderBy('roadmap.created_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      query.getCount(),
    ]);
    return new PaginationResultDto(
      'roadmaps',
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        relative: row.relative
          ? { id: row.relative.id, fullname: row.relative.fullname }
          : null,
        pdfUrl: `/api/v1/health-roadmaps/${row.id}/file`,
        fileName: row.output_asset.fileName,
      })),
      total,
      page,
      limit,
    );
  }

  async getHealthRoadmap(userId: number, id: number) {
    const row = await this.roadmapRepo.findOne({
      where: { id, user: { id: userId } },
      relations: { relative: true },
    });
    if (!row) throw new NotFoundException('Không tìm thấy lộ trình sức khỏe.');
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      relative: { id: row.relative.id, fullname: row.relative.fullname },
      pdfUrl: `/api/v1/health-roadmaps/${row.id}/file`,
      fileName: row.output_asset.fileName,
    };
  }

  async getHealthRoadmapFile(userId: number, id: number, download = false) {
    const row = await this.roadmapRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy lộ trình sức khỏe.');
    return this.documentStorage.getDownloadUrl(row.output_asset, download);
  }

  async deleteHealthRoadmap(userId: number, id: number) {
    const row = await this.roadmapRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row) throw new NotFoundException('Không tìm thấy lộ trình sức khỏe.');
    await this.documentStorage.deleteAsset(row.output_asset);
    await this.roadmapRepo.softDelete(id);
    return { success: true };
  }

  async getChatHistory(userId: number, page: number = 1, limit: number = 50) {
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.user', 'user')
      .select([
        'conversation.id AS id',
        'conversation.role AS role',
        'conversation.content AS content',
      ])
      .where('user.id = :userId', { userId })
      .orderBy('conversation.created_at', 'DESC')
      .limit(limit)
      .offset(skip);

    const [messages, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const result = {
      total,
      messages: messages.reverse(),
      page,
      limit,
      totalPages,
    };

    return result;
  }
}
