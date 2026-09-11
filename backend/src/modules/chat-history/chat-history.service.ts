import {
  HttpException,
  HttpStatus,
  Injectable,
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
import { MedicalRecordUpload } from './medical-record-upload';

// Mọi call ra chatbot đều phải có timeout rõ ràng — trước đây axios dùng
// default (không timeout), request có thể treo vô thời hạn nếu chatbot
// không phản hồi.
const CHATBOT_REQUEST_TIMEOUT_MS = 30_000;
const CHATBOT_SUMMARY_REQUEST_TIMEOUT_MS = 120_000;

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

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
  }

  async getChatHistoryContext(userId: number) {
    const user = await this.usersService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại!');
    }
    const history = await this.conversationRepo.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      take: 10,
    });

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

      return response.data?.data;
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
  ): Promise<string> {
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
      const summary = response.data?.data;
      if (typeof summary !== 'string' || summary.trim().length === 0) {
        throw new HttpException(
          {
            code: 'CHATBOT_SUMMARY_INVALID_RESPONSE',
            message: 'Chatbot returned an invalid medical record summary.',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      return summary;
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
