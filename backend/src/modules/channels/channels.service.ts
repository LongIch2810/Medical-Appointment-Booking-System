import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
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
    const memberIds = [...new Set(member_ids.map(Number))].filter(Boolean);
    if (memberIds.length < 2) {
      throw new BadRequestException(
        'Kênh trò chuyện cần ít nhất 2 người tham gia.',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const existingChannel = await this.findChannelByExactMemberIds(
          memberIds,
          manager,
        );
        if (existingChannel) {
          return ChannelsMapper.toChannelResponseDto(existingChannel);
        }

        const createdChannel = manager.create(Channel);
        await manager.save(Channel, createdChannel);
        const members = memberIds.map((m) =>
          manager.create(ChannelMembers, {
            channel: createdChannel,
            user: { id: m },
          }),
        );
        await manager.save(ChannelMembers, members);
        const channel = await this.findByChannelId(createdChannel.id, manager);
        return ChannelsMapper.toChannelResponseDto(channel);
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
    try {
      const { search, arrange } = objectFilters;
      let { page, limit } = objectFilters;
      const isUserExists = await this.usersService.isUserExists(userId);
      if (!isUserExists) {
        throw new BadRequestException('Người dùng không tồn tại');
      }
      page = Math.max(page, 1);
      limit = Math.max(limit, 1);
      const skip = (page - 1) * limit;
      const arrangeOrder = (arrange ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
      const query = this.baseChannelsQuery()
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('cm.channel_id')
            .from('channel_members', 'cm')
            .where('cm.participant_id = :userId');

          return `channel.id IN ${subQuery.getQuery()}`;
        })
        .setParameter('userId', userId)
        .orderBy('channel.updated_at', arrangeOrder)
        .skip(skip)
        .take(limit)
        .distinct(true);

      if (search) {
        query.andWhere((qb) => {
          const searchSubQuery = qb
            .subQuery()
            .select('1')
            .from('channel_members', 'cm_search')
            .innerJoin(
              'users',
              'u_search',
              'u_search.id = cm_search.participant_id',
            )
            .where('cm_search.channel_id = channel.id')
            .andWhere('u_search.id != :userId')
            .andWhere(
              '(u_search.username ILIKE :search OR u_search.fullname ILIKE :search)',
            )
            .getQuery();

          return `EXISTS ${searchSubQuery}`;
        });
        query.setParameter('search', `%${search}%`);
      }

      const [channels, total] = await query.getManyAndCount();

      return new PaginationResultDto(
        'channels',
        ChannelsMapper.toChannelResponseDtoList(channels),
        total,
        page,
        limit,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getChannel(channelId: number) {
    const channel = await this.findByChannelId(channelId);
    return ChannelsMapper.toChannelResponseDto(channel);
  }

  async findByChannelId(channelId: number, manager?: EntityManager) {
    const channelRepo = manager?.getRepository(Channel) ?? this.channelRepo;
    const channel = await channelRepo.findOne({
      where: { id: channelId },
      relations: ['participants', 'participants.user', 'chat_messages'],
    });
    if (!channel) {
      throw new BadRequestException('Kênh trò chuyện không tồn tại');
    }
    return channel;
  }

  private async findChannelByExactMemberIds(
    memberIds: number[],
    manager?: EntityManager,
  ) {
    const channelRepo = manager?.getRepository(Channel) ?? this.channelRepo;
    const existingChannel = await channelRepo
      .createQueryBuilder('channel')
      .innerJoin('channel.participants', 'participant')
      .innerJoin('participant.user', 'user')
      .groupBy('channel.id')
      .having('COUNT(DISTINCT user.id) = :count', {
        count: memberIds.length,
      })
      .andHaving(
        'COUNT(DISTINCT CASE WHEN user.id IN (:...memberIds) THEN user.id END) = :count',
        { count: memberIds.length, memberIds },
      )
      .getOne();

    if (!existingChannel) {
      return null;
    }

    return this.findByChannelId(existingChannel.id, manager);
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
