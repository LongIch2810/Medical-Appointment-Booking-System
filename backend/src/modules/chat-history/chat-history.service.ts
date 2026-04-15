import {
  HttpException,
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
      );
      return response.data.answer;
    } catch (error: any) {
      console.log('>>> error:', error);
      console.error('Chatbot error:', error?.response?.data || error.message);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

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
