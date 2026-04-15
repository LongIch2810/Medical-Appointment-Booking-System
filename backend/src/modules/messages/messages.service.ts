import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageAttachments)
    private readonly messageAttachmentRepo: Repository<MessageAttachments>,
    private readonly channelsService: ChannelsService,
    private readonly usersService: UsersService,
  ) {}
  async saveMessage(bodyCreateMessage: BodyCreateMessageDto) {
    if (bodyCreateMessage?.content) {
      bodyCreateMessage.content = encrypt(bodyCreateMessage.content);
    }
    const createdMessage = this.messageRepo.create({
      ...bodyCreateMessage,
      sender: { id: bodyCreateMessage.sender_id },
      channel: { id: bodyCreateMessage.channel_id },
    });
    const newMessage = await this.messageRepo.save(createdMessage);
    return this.getMessageByMessageId(newMessage.id);
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

  async getMessageByChannelId(
    channelId: number,
    page: number = 1,
    limit: number = 7,
  ) {
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
