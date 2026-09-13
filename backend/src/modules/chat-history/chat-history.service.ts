import {
  HttpException,
  HttpStatus,
  Injectable,
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
import { MedicalRecordUpload } from './medical-record-upload';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { randomUUID } from 'crypto';
import AiHealthRoadmap from 'src/entities/aiHealthRoadmap.entity';
import AiMedicalRecordSummary from 'src/entities/aiMedicalRecordSummary.entity';
import Relative from 'src/entities/relative.entity';
import { AiDocumentAsset } from 'src/shared/types/aiDocumentAsset.type';
import { AiDocumentStorageService } from '../ai-documents/ai-document-storage.service';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

// Mọi call ra chatbot đều phải có timeout rõ ràng — trước đây axios dùng
// default (không timeout), request có thể treo vô thời hạn nếu chatbot
// không phản hồi.
// Chatbot service (Render free plan) tự spin-down sau ~15 phút không có
// traffic; cold-start phải load xong Qdrant/LangChain trước khi bind port,
// đo thực tế mất ~80-90s. 30s cũ luôn timeout ngay lần chat đầu sau khi
// service ngủ — nới lên 100s để chờ hết cold-start thay vì báo lỗi giả.
const CHATBOT_REQUEST_TIMEOUT_MS = 100_000;
const CHATBOT_SUMMARY_REQUEST_TIMEOUT_MS = 120_000;
const CHATBOT_KEEP_ALIVE_TIMEOUT_MS = 5_000;
const CHAT_HISTORY_CONTEXT_LIMIT = 10;
const CHAT_HISTORY_CACHE_TTL_SECONDS = 3_600;

type CachedChatMessage = {
  role: RoleMessage;
  content: string;
};

@Injectable()
export class ChatHistoryService {
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
    @InjectRepository(AiMedicalRecordSummary)
    private readonly summaryRepo: Repository<AiMedicalRecordSummary>,
    @Optional()
    @InjectRepository(Relative)
    private readonly relativeRepo: Repository<Relative>,
    @Optional() private readonly documentStorage: AiDocumentStorageService,
  ) {}

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

    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/chat`,
        {
          question,
          userId,
          token,
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
      return response.data.answer;
    } catch (error: any) {
      console.error('Chatbot request failed:', {
        status: error?.response?.status,
        code: error?.code,
      });
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (
          status === 504 ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT'
        ) {
          throw new HttpException(
            {
              code: 'CHATBOT_CHAT_TIMEOUT',
              message: 'Chatbot chưa phản hồi kịp thời. Vui lòng thử lại sau.',
            },
            HttpStatus.GATEWAY_TIMEOUT,
          );
        }

        if (status === 401) {
          throw new UnauthorizedException(
            'Token chatbot không hợp lệ hoặc đã hết hạn.',
          );
        }
      }
      throw new HttpException(
        'Không thể lấy phản hồi từ chatbot.',
        error?.response?.status || 500,
      );
    }
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

    try {
      const response = await axios.post(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/build-health-roadmap`,
        {
          relative_id: relativeId,
          token,
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
      };
      if (!data?.asset?.publicId && data?.pdfUrl) return data;
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
          output_asset: data.asset,
        });
        return {
          id: saved.id,
          createdAt: saved.created_at,
          title: saved.title,
          pdfUrl: `/api/v1/health-roadmaps/${saved.id}/file`,
        };
      } catch (saveError) {
        if (this.documentStorage)
          await this.documentStorage
            .deleteAsset(data.asset)
            .catch(() => undefined);
        throw saveError;
      }
    } catch (error: unknown) {
      if (!axios.isAxiosError(error)) {
        throw new HttpException(
          'Không thể tạo lộ trình sức khỏe từ chatbot.',
          500,
        );
      }

      const status = error.response?.status ?? 500;
      const responseData = error.response?.data as
        | {
            message?: string;
            err?: string;
            details?: string | string[];
            error?: { details?: string | string[] };
          }
        | undefined;

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

      const downstreamDetails =
        responseData?.error?.details ?? responseData?.details;
      const message =
        responseData?.message ||
        responseData?.err ||
        (typeof downstreamDetails === 'string'
          ? downstreamDetails
          : downstreamDetails?.[0]) ||
        'Không thể tạo lộ trình sức khỏe từ chatbot.';

      throw new HttpException(
        {
          code: 'CHATBOT_HEALTH_ROADMAP_FAILED',
          message,
        },
        status,
      );
    }
  }

  async summarizeMedicalRecord(
    userId: number,
    token: string,
    upload: MedicalRecordUpload,
  ): Promise<{
    summary: string;
    document: {
      id: number;
      createdAt: Date;
      pdfUrl: string;
      sourceFiles: Array<
        Pick<AiDocumentAsset, 'id' | 'fileName' | 'bytes' | 'format'> & {
          fileUrl?: string;
        }
      >;
    };
  }> {
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    if (!token) {
      throw new UnauthorizedException('Không có token xác thực.');
    }

    const form = new FormData();
    for (const file of upload.files) {
      const fileBytes = Uint8Array.from(file.buffer);
      form.append(
        upload.fieldName,
        new Blob([fileBytes], { type: file.mimetype }),
        file.originalname,
      );
    }

    try {
      const response = await axios.post<{ data?: unknown }>(
        `${this.configService.get<string>('CHATBOT_URL')}/chatbot/upload/summary-medical-record`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-chatbot-internal-key': this.configService.getOrThrow<string>(
              'CHATBOT_INTERNAL_KEY',
            ),
          },
          timeout: CHATBOT_SUMMARY_REQUEST_TIMEOUT_MS,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );
      const data = response.data?.data as {
        summary?: unknown;
        asset?: AiDocumentAsset;
      };
      const summary = data?.summary;
      if (typeof response.data?.data === 'string')
        return response.data.data as any;
      if (
        typeof summary !== 'string' ||
        summary.trim().length === 0 ||
        !data?.asset?.publicId
      ) {
        throw new HttpException(
          {
            code: 'CHATBOT_SUMMARY_INVALID_RESPONSE',
            message: 'Chatbot returned an invalid medical record summary.',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      const sourceAssets: AiDocumentAsset[] = [];
      try {
        for (const file of upload.files) {
          const asset = await this.documentStorage.uploadBuffer(
            file.buffer,
            file.originalname,
            file.mimetype,
            'ai-documents/sources',
          );
          sourceAssets.push({ ...asset, id: randomUUID() });
        }
        const saved = await this.summaryRepo.save({
          user: { id: userId },
          summary,
          input_mode: upload.fieldName,
          source_assets: sourceAssets,
          output_asset: data.asset,
        });
        return {
          summary,
          document: {
            id: saved.id,
            createdAt: saved.created_at,
            pdfUrl: `/api/v1/medical-record-summaries/${saved.id}/file`,
            sourceFiles: sourceAssets.map(
              ({ id, fileName, bytes, format }) => ({
                id,
                fileName,
                bytes,
                format,
                fileUrl: `/api/v1/medical-record-summaries/${saved.id}/sources/${id}/file`,
              }),
            ),
          },
        };
      } catch (saveError) {
        if (this.documentStorage) {
          await this.documentStorage
            .deleteAssets(sourceAssets)
            .catch(() => undefined);
          await this.documentStorage
            .deleteAsset(data.asset)
            .catch(() => undefined);
        }
        throw saveError;
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (
          status === HttpStatus.GATEWAY_TIMEOUT ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT'
        ) {
          throw new HttpException(
            {
              code: 'CHATBOT_SUMMARY_TIMEOUT',
              message: 'AI chưa phản hồi kịp thời. Vui lòng thử lại sau.',
            },
            HttpStatus.GATEWAY_TIMEOUT,
          );
        }
        if (status === HttpStatus.UNAUTHORIZED) {
          throw new UnauthorizedException(
            'Token chatbot không hợp lệ hoặc đã hết hạn.',
          );
        }
        if (status && status >= 400 && status < 500) {
          const body = error.response?.data as
            { message?: unknown; err?: unknown } | undefined;
          const message =
            typeof body?.message === 'string'
              ? body.message
              : typeof body?.err === 'string'
                ? body.err
                : 'Tệp bệnh án không hợp lệ.';
          throw new HttpException(
            { code: 'CHATBOT_SUMMARY_REJECTED', message },
            status,
          );
        }
      }

      throw new HttpException(
        {
          code: 'CHATBOT_SUMMARY_UNAVAILABLE',
          message: 'Không thể kết nối tới dịch vụ tóm tắt bệnh án.',
        },
        HttpStatus.BAD_GATEWAY,
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

  async getMedicalSummaryHistory(userId: number, page = 1, limit = 10) {
    page = Math.max(1, page);
    limit = Math.min(50, Math.max(1, limit));
    const [rows, total] = await this.summaryRepo.findAndCount({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return new PaginationResultDto(
      'summaries',
      rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        inputMode: row.input_mode,
        pdfUrl: `/api/v1/medical-record-summaries/${row.id}/file`,
        sourceFiles: row.source_assets.map(
          ({ id, fileName, bytes, format }) => ({
            id,
            fileName,
            bytes,
            format,
          }),
        ),
      })),
      total,
      page,
      limit,
    );
  }

  async getMedicalSummary(userId: number, id: number) {
    const row = await this.summaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row)
      throw new NotFoundException('Không tìm thấy bản tóm tắt bệnh án.');
    const document = {
      id: row.id,
      createdAt: row.created_at,
      pdfUrl: `/api/v1/medical-record-summaries/${row.id}/file`,
      sourceFiles: row.source_assets.map(({ id, fileName, bytes, format }) => ({
        id,
        fileName,
        bytes,
        format,
        fileUrl: `/api/v1/medical-record-summaries/${row.id}/sources/${id}/file`,
      })),
    };
    return {
      summary: row.summary,
      inputMode: row.input_mode,
      ...document,
      document,
    };
  }

  async getMedicalSummaryFile(userId: number, id: number, download = false) {
    const row = await this.summaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row)
      throw new NotFoundException('Không tìm thấy bản tóm tắt bệnh án.');
    return this.documentStorage.getDownloadUrl(row.output_asset, download);
  }

  async getMedicalSummarySourceFile(
    userId: number,
    id: number,
    sourceId: string,
    download = false,
  ) {
    const row = await this.summaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row)
      throw new NotFoundException('Không tìm thấy bản tóm tắt bệnh án.');
    const asset = row.source_assets.find((item) => item.id === sourceId);
    if (!asset) throw new NotFoundException('Không tìm thấy file bệnh án gốc.');
    return this.documentStorage.getDownloadUrl(asset, download);
  }

  async deleteMedicalSummary(userId: number, id: number) {
    const row = await this.summaryRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!row)
      throw new NotFoundException('Không tìm thấy bản tóm tắt bệnh án.');
    await this.documentStorage.deleteAssets([
      ...row.source_assets,
      row.output_asset,
    ]);
    await this.summaryRepo.softDelete(id);
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
