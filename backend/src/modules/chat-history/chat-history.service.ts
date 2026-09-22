import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
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
import { getChatbotUpstreamError } from 'src/utils/chatbotUpstreamError';
import PatientChatConversation from 'src/entities/patientChatConversation.entity';
import PatientChatMessage, {
  PatientChatAction,
} from 'src/entities/patientChatMessage.entity';
import { randomUUID } from 'node:crypto';

// Má»i call ra chatbot Ä‘á»u pháº£i cÃ³ timeout rÃµ rÃ ng â€” trÆ°á»›c Ä‘Ã¢y axios dÃ¹ng
// default (khÃ´ng timeout), request cÃ³ thá»ƒ treo vÃ´ thá»i háº¡n náº¿u chatbot
// khÃ´ng pháº£n há»“i.
// Chatbot service (Render free plan) tá»± spin-down sau ~15 phÃºt khÃ´ng cÃ³
// traffic; cold-start pháº£i load xong Qdrant/LangChain trÆ°á»›c khi bind port,
// Ä‘o thá»±c táº¿ máº¥t ~80-90s. 30s cÅ© luÃ´n timeout ngay láº§n chat Ä‘áº§u sau khi
// service ngá»§ â€” ná»›i lÃªn 100s Ä‘á»ƒ chá» háº¿t cold-start thay vÃ¬ bÃ¡o lá»—i giáº£.
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
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y cuá»™c trÃ² chuyá»‡n.');
    return conversation;
  }

  async createPatientChatConversation(userId: number) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) throw new NotFoundException('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i!');
    const conversation = await this.patientChatConversationRepo.save({
      user,
      title: 'Cuá»™c trÃ² chuyá»‡n má»›i',
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
          message: 'YÃªu cáº§u gá»­i tin nháº¯n khÃ´ng há»£p lá»‡.',
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
            message: 'YÃªu cáº§u xÃ¡c nháº­n Ä‘áº·t lá»‹ch khÃ´ng cÃ²n há»£p lá»‡.',
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
            message: 'YÃªu cáº§u xÃ¡c nháº­n Ä‘áº·t lá»‹ch khÃ´ng cÃ²n há»£p lá»‡.',
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
        decision === 'APPROVE' ? 'XÃ¡c nháº­n Ä‘áº·t lá»‹ch' : 'Há»§y yÃªu cáº§u Ä‘áº·t lá»‹ch';
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
            message: 'Tin nháº¯n khÃ´ng há»£p lá»‡ hoáº·c quÃ¡ dÃ i.',
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
          'Cuá»™c trÃ² chuyá»‡n má»›i';
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
              'Cuá»™c trÃ² chuyá»‡n má»›i',
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
          message: 'Chatbot tráº£ vá» pháº£n há»“i khÃ´ng há»£p lá»‡.',
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
        'XÃƒÂ¡c thÃ¡Â»Â±c vÃ¡Â»â€ºi trÃ¡Â»Â£ lÃƒÂ½ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.',
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
          upstream.message || 'KhÃ´ng thá»ƒ nháº­n pháº£n há»“i tá»« trá»£ lÃ½ lÃºc nÃ y.',
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

  // Chatbot service (Render free plan) tá»± spin-down sau ~15 phÃºt khÃ´ng
  // traffic vÃ  cold-start máº¥t ~80-90s, khiáº¿n tin nháº¯n chat Ä‘áº§u tiÃªn sau
  // thá»i gian nghá»‰ luÃ´n bá»‹ chá» lÃ¢u/timeout. Ping /healthy Ä‘á»‹nh ká»³ Ä‘á»ƒ giá»¯
  // service "áº¥m" trong lÃºc site cÃ²n cÃ³ ngÆ°á»i dÃ¹ng hoáº¡t Ä‘á»™ng.
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
      throw new NotFoundException('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i!');
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
      throw new NotFoundException('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i!');
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
      throw new NotFoundException('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i!');
    }

    if (!token) {
      throw new UnauthorizedException('KhÃ´ng cÃ³ token xÃ¡c thá»±c.');
    }

    const conversation =
      (await this.patientChatConversationRepo.findOne({
        where: { user: { id: userId } },
        order: { updated_at: 'DESC' },
      })) ??
      (await this.patientChatConversationRepo.save({
        user: { id: userId },
        title: 'Cuá»™c trÃ² chuyá»‡n má»›i',
      }));
    const result = await this.sendPatientChatMessage(
      userId,
      conversation.id,
      token,
      { message: question },
    );
    return result.assistantMessage.content;
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
