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
  SelectQueryBuilder,
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
        const existingChannel =
          await this.findChannelByExactMemberIds(memberIds);
        if (existingChannel) {
          return ChannelsMapper.toChannelResponseDto(existingChannel);
        }

        const createdChannel = manager.create(Channel);
        const saved = await manager.save(Channel, createdChannel);
        const members = memberIds.map((m) =>
          manager.create(ChannelMembers, {
            channel: saved,
            user: { id: m },
          }),
        );
        await manager.save(ChannelMembers, members);

        const channel = await this.findByChannelIdTransaction(
          manager,
          saved.id,
        );
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

      const query = this.baseChannelsQuery(userId)
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('cm.channel_id')
            .from('channel_members', 'cm')
            .where('cm.participant_id = :userId');

          return `channel.id IN ${subQuery.getQuery()}`;
        })
        .setParameter('userId', userId)
        .orderBy('last_message_created_at', arrangeOrder, 'NULLS LAST')
        .addOrderBy('channel.created_at', arrangeOrder)
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

      const { entities, raw } = await query.getRawAndEntities();
      const total = await this.buildTotalChannelsQuery(
        userId,
        search,
      ).getCount();

      const enriched = entities.map((channel) => {
        const row = raw.find(
          (r: Record<string, unknown>) =>
            Number(r.channel_id ?? r['channel_id']) === channel.id,
        );
        return Object.assign(channel, {
          last_message_content: row?.last_message_content ?? null,
          last_message_created_at: row?.last_message_created_at ?? null,
          last_message_sender_id: row?.last_message_sender_id ?? null,
          unread_count: Number(row?.unread_count ?? 0),
        });
      });

      return new PaginationResultDto(
        'channels',
        ChannelsMapper.toChannelResponseDtoList(enriched),
        total,
        page,
        limit,
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getChannel(channelId: number, currentUserId?: number) {
    const channel = await this.findByChannelId(channelId, currentUserId);
    return ChannelsMapper.toChannelResponseDto(channel);
  }

  async findByChannelId(channelId: number, currentUserId?: number) {
    const query = this.baseChannelsQuery(currentUserId).where(
      'channel.id = :channelId',
      { channelId },
    );

    const { entities, raw } = await query.getRawAndEntities();
    const channel = entities[0];
    if (!channel) {
      throw new BadRequestException('Kênh trò chuyện không tồn tại');
    }
    const row = raw.find(
      (r: Record<string, unknown>) =>
        Number(r.channel_id ?? r['channel_id']) === channel.id,
    );
    return Object.assign(channel, {
      last_message_content: row?.last_message_content ?? null,
      last_message_created_at: row?.last_message_created_at ?? null,
      last_message_sender_id: row?.last_message_sender_id ?? null,
      unread_count: Number(row?.unread_count ?? 0),
    });
  }

  private async findByChannelIdTransaction(
    manager: EntityManager,
    channelId: number,
  ) {
    const channel = await manager.findOne(Channel, {
      where: { id: channelId },
      relations: ['participants', 'participants.user'],
    });
    if (!channel) {
      throw new BadRequestException('Kênh trò chuyện không tồn tại');
    }
    return channel;
  }

  private async findChannelByExactMemberIds(memberIds: number[]) {
    const existingChannel = await this.channelRepo
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

    return this.findByChannelId(existingChannel.id);
  }

  async isChannelExists(userId: number, channelId: number): Promise<boolean> {
    const channel = await this.channelRepo.findOne({
      where: { id: channelId, participants: { user: { id: userId } } },
    });
    return !!channel;
  }

  private baseChannelsQuery(currentUserId?: number) {
    const query: SelectQueryBuilder<Channel> = this.channelRepo
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .addSelect(
        (qb) =>
          qb
            .select('m.content')
            .from('messages', 'm')
            .where('m.channel_id = channel.id')
            .andWhere('m.deleted_at IS NULL')
            .orderBy('m.created_at', 'DESC')
            .limit(1),
        'last_message_content',
      )
      .addSelect(
        (qb) =>
          qb
            .select('m.created_at')
            .from('messages', 'm')
            .where('m.channel_id = channel.id')
            .andWhere('m.deleted_at IS NULL')
            .orderBy('m.created_at', 'DESC')
            .limit(1),
        'last_message_created_at',
      )
      .addSelect(
        (qb) =>
          qb
            .select('m.sender_id')
            .from('messages', 'm')
            .where('m.channel_id = channel.id')
            .andWhere('m.deleted_at IS NULL')
            .orderBy('m.created_at', 'DESC')
            .limit(1),
        'last_message_sender_id',
      );

    if (currentUserId) {
      query
        .addSelect(
          (qb) =>
            qb
              .select('COUNT(*)')
              .from('messages', 'm')
              .where('m.channel_id = channel.id')
              .andWhere('m.deleted_at IS NULL')
              .andWhere('m.is_read = false')
              .andWhere('m.sender_id <> :currentUserId'),
          'unread_count',
        )
        .setParameter('currentUserId', currentUserId);
    } else {
      query.addSelect('0', 'unread_count');
    }

    return query;
  }

  private buildTotalChannelsQuery(userId: number, search?: string) {
    const totalQuery = this.channelRepo
      .createQueryBuilder('channel')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('cm.channel_id')
          .from('channel_members', 'cm')
          .where('cm.participant_id = :userId');

        return `channel.id IN ${subQuery.getQuery()}`;
      })
      .setParameter('userId', userId);

    if (search) {
      totalQuery.andWhere((qb) => {
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
      totalQuery.setParameter('search', `%${search}%`);
    }

    return totalQuery;
  }
}
