import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, QueryFailedError, Repository } from 'typeorm';
import Channel from 'src/entities/channel.entity';
import ChannelMembers from 'src/entities/channelMembers.entity';
import { UsersService } from '../users/users.service';
import { ChannelsMapper } from './channels.mapper';
import { BodyFilterChannelsDto } from './dto/request/bodyFilterChannels.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    private readonly usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async createChannel(member_ids: number[]) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const createdChannel = manager.create(Channel);
        await manager.save(Channel, createdChannel);
        const members = member_ids.map((m) =>
          manager.create(ChannelMembers, {
            channel: createdChannel,
            user: { id: m },
          }),
        );
        await manager.save(ChannelMembers, members);
        return this.getChannel(createdChannel.id);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Kênh trò chuyện đã tồn tại giữa những người dùng này.',
        );
      }
      throw error;
    }
  }

  async findChannelsByUserId(
    userId: number,
    objectFilters: BodyFilterChannelsDto,
  ) {
    let { page, limit, search, arrange } = objectFilters;
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new BadRequestException('Người dùng không tồn tại');
    }
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    const query = this.baseChannelsQuery()
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('cm.channel.id')
          .from('channel_members', 'cm')
          .innerJoin('users', 'u', ' cm.user.id = u.id')
          .where('u.id = :userId');

        return `channel.id IN ${subQuery.getQuery()}`;
      })
      .setParameter('userId', userId)
      .orderBy('channel.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .distinct(true);

    if (search) {
      query.andWhere(
        '(user.id != :userId AND (user.username ILIKE :search OR user.fullname ILIKE :search))',
        { userId, search: `%${search}%` },
      );
    }

    const [channels, total] = await query.getManyAndCount();

    return new PaginationResultDto(
      'channels',
      ChannelsMapper.toChannelResponseDtoList(channels),
      total,
      page,
      limit,
    );
  }

  async getChannel(channelId: number) {
    const channel = await this.findByChannelId(channelId);
    return ChannelsMapper.toChannelResponseDto(channel);
  }

  async findByChannelId(channelId: number) {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId },
      relations: ['participants', 'participants.user', 'chat_messages'],
    });
    if (!channel) {
      throw new BadRequestException('Kênh trò chuyện không tồn tại');
    }
    return channel;
  }

  async isChannelExists(userId: number, channelId: number): Promise<boolean> {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId, participants: { user: { id: userId } } },
    });
    return !!channel;
  }

  private baseChannelsQuery() {
    return this.channelRepo
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.chat_messages', 'chatMessages')
      .leftJoinAndSelect('channel.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user');
  }
}
