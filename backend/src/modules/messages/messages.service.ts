import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import Message from 'src/entities/message.entity';
import MessageAttachments from 'src/entities/messageAttachments.entity';
import { Not, Repository } from 'typeorm';
import { BodyCreateMessageDto } from './dto/request/bodyCreateMessage.dto';
import { UploadFileResponse } from 'src/shared/interfaces/uploadFileResponse';
import { decrypt, encrypt } from 'src/utils/encryption';
import { MessagesMapper } from './messages.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { ChannelsService } from '../channels/channels.service';
import { UsersService } from '../users/users.service';
import { WEBSOCKET_GATEWAY } from 'src/websockets/websocket-gateway.token';

/**
 * Structural shape of WebsocketGateway used here — deliberately NOT importing
 * the concrete class. messages.service.ts and websocket.gateway.ts already
 * reference each other's services; importing the real WebsocketGateway class
 * here would recreate that file-level circular import and corrupt the OTHER
 * file's `design:paramtypes` decorator metadata under some bundlers/loaders
 * (webpack's Nest dev builder), throwing "Cannot access 'X' before
 * initialization" or leaving a DI param type unresolved. Resolving the
 * gateway lazily via ModuleRef + a plain injection token sidesteps this.
 */
interface RealtimeMessageGateway {
  server: {
    to(room: string): { emit(event: string, payload: unknown): void };
  };
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageAttachments)
    private readonly messageAttachmentRepo: Repository<MessageAttachments>,
    private readonly channelsService: ChannelsService,
    private readonly usersService: UsersService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async assertChannelMember(userId: number, channelId: number): Promise<void> {
    const isChannelMember = await this.channelsService.isChannelExists(
      userId,
      channelId,
    );
    if (!isChannelMember) {
      throw new NotFoundException(
        'Kênh trò chuyện không tồn tại hoặc bạn không thuộc về kênh này !',
      );
    }
  }

  /**
   * Chỉ chính người gửi tin nhắn mới được đính kèm file cho nó — chặn IDOR
   * khi client truyền message_id của người khác lên endpoint upload.
   */
  async assertMessageSender(userId: number, messageId: number): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại !');
    }
    if (message.sender?.id !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền đính kèm tệp cho tin nhắn này.',
      );
    }
  }

  async saveMessage(
    bodyCreateMessage: BodyCreateMessageDto,
    authenticatedUserId: number,
  ) {
    await this.assertChannelMember(
      authenticatedUserId,
      bodyCreateMessage.channel_id,
    );
    const createdMessage = this.messageRepo.create({
      message_type: bodyCreateMessage.message_type,
      content: bodyCreateMessage.content
        ? encrypt(bodyCreateMessage.content)
        : null,
      sender: { id: authenticatedUserId },
      channel: { id: bodyCreateMessage.channel_id },
    });
    const newMessage = await this.messageRepo.save(createdMessage);
    const message = await this.getMessageByMessageId(newMessage.id);
    const websocketGateway = this.moduleRef.get<RealtimeMessageGateway>(
      WEBSOCKET_GATEWAY,
      { strict: false },
    );
    websocketGateway.server
      .to(`room:${message.channel.id}`)
      .emit('receive:message', message);
    return message;
  }

  async updateFilesMessage(messageId: number, files: UploadFileResponse[]) {
    const exists = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!exists) {
      throw new NotFoundException('Tin nhắn không tồn tại !');
    }
    const attachments = files.map((file) =>
      this.messageAttachmentRepo.create({
        message: { id: messageId },
        ...file,
      }),
    );

    await this.messageAttachmentRepo.save(attachments);
    return await this.getMessageByMessageId(messageId);
  }

  async getMessageByMessageId(messageId: number) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['message_attachments', 'sender', 'channel'],
    });
    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại !');
    }
    if (message?.content) {
      message.content = decrypt(message.content);
    }
    return MessagesMapper.toMessageResponseDto(message);
  }

  async markChannelMessagesAsRead(channelId: number, userId: number) {
    await this.assertChannelMember(userId, channelId);
    const result = await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ is_read: true })
      .where('channel_id = :channelId', { channelId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();
    return { updated: result.affected ?? 0 };
  }

  async getMessageByChannelId(
    channelId: number,
    authenticatedUserId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    await this.assertChannelMember(authenticatedUserId, channelId);
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const [messages, total] = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.message_attachments', 'attachments')
      .where('message.channel_id = :channelId', { channelId })
      .orderBy('message.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const result = new PaginationResultDto(
      'messages',
      MessagesMapper.toMessageResponseDtoList(
        messages.map((m: Message) => ({
          ...m,
          content: m.content ? decrypt(m.content) : null,
        })),
      ),
      total,
      page,
      limit,
    );

    return result;
  }

  async numberOfMessagesUnreadInChannel(userId: number, channelId: number) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại !');
    }
    const isChannelExists = await this.channelsService.isChannelExists(
      userId,
      channelId,
    );
    if (!isChannelExists) {
      throw new NotFoundException(
        'Kênh trò chuyện không tồn tại hoặc bạn không thuộc về kênh này !',
      );
    }
    const count = await this.messageRepo.count({
      where: {
        channel: { id: channelId, participants: { user: { id: userId } } },
        is_read: false,
        sender: { id: Not(userId) },
      },
    });
    return count;
  }

  async numberOfMessagesUnreadInAllChannel(userId: number) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại !');
    }
    const count = await this.messageRepo.count({
      where: {
        is_read: false,
        sender: { id: Not(userId) },
        channel: {
          participants: {
            user: { id: userId },
          },
        },
      },
    });
    return count;
  }
}
