"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChannelsService", {
    enumerable: true,
    get: function() {
        return ChannelsService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _channelentity = /*#__PURE__*/ _interop_require_default(require("../../entities/channel.entity"));
const _channelMembersentity = /*#__PURE__*/ _interop_require_default(require("../../entities/channelMembers.entity"));
const _usersservice = require("../users/users.service");
const _channelsmapper = require("./channels.mapper");
const _paginationResultdto = require("../../common/dto/paginationResult.dto");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ChannelsService = class ChannelsService {
    async createChannel(member_ids) {
        const memberIds = [
            ...new Set(member_ids.map(Number))
        ].filter(Boolean);
        if (memberIds.length < 2) {
            throw new _common.BadRequestException('Kênh trò chuyện cần ít nhất 2 người tham gia.');
        }
        try {
            return await this.dataSource.transaction(async (manager)=>{
                const existingChannel = await this.findChannelByExactMemberIds(memberIds);
                if (existingChannel) {
                    return _channelsmapper.ChannelsMapper.toChannelResponseDto(existingChannel);
                }
                const createdChannel = manager.create(_channelentity.default);
                const saved = await manager.save(_channelentity.default, createdChannel);
                const members = memberIds.map((m)=>manager.create(_channelMembersentity.default, {
                        channel: saved,
                        user: {
                            id: m
                        }
                    }));
                await manager.save(_channelMembersentity.default, members);
                const channel = await this.findByChannelIdTransaction(manager, saved.id);
                return _channelsmapper.ChannelsMapper.toChannelResponseDto(channel);
            });
        } catch (error) {
            if (error instanceof _typeorm1.QueryFailedError && error.driverError?.code === '23505') {
                throw new _common.ConflictException('Kênh trò chuyện đã tồn tại giữa những người dùng này.');
            }
            throw error;
        }
    }
    async findChannelsByUserId(userId, objectFilters) {
        try {
            const { search, arrange } = objectFilters;
            let { page, limit } = objectFilters;
            const isUserExists = await this.usersService.isUserExists(userId);
            if (!isUserExists) {
                throw new _common.BadRequestException('Người dùng không tồn tại');
            }
            page = Math.max(page, 1);
            limit = Math.max(limit, 1);
            const skip = (page - 1) * limit;
            const arrangeOrder = (arrange ?? 'desc').toUpperCase();
            const query = this.baseChannelsQuery(userId).where((qb)=>{
                const subQuery = qb.subQuery().select('cm.channel_id').from('channel_members', 'cm').where('cm.participant_id = :userId');
                return `channel.id IN ${subQuery.getQuery()}`;
            }).setParameter('userId', userId).orderBy('last_message_created_at', arrangeOrder, 'NULLS LAST').addOrderBy('channel.created_at', arrangeOrder).skip(skip).take(limit).distinct(true);
            if (search) {
                query.andWhere((qb)=>{
                    const searchSubQuery = qb.subQuery().select('1').from('channel_members', 'cm_search').innerJoin('users', 'u_search', 'u_search.id = cm_search.participant_id').where('cm_search.channel_id = channel.id').andWhere('u_search.id != :userId').andWhere('(u_search.username ILIKE :search OR u_search.fullname ILIKE :search)').getQuery();
                    return `EXISTS ${searchSubQuery}`;
                });
                query.setParameter('search', `%${search}%`);
            }
            const { entities, raw } = await query.getRawAndEntities();
            const total = await this.buildTotalChannelsQuery(userId, search).getCount();
            const enriched = entities.map((channel)=>{
                const row = raw.find((r)=>Number(r.channel_id ?? r['channel_id']) === channel.id);
                return Object.assign(channel, {
                    last_message_content: row?.last_message_content ?? null,
                    last_message_created_at: row?.last_message_created_at ?? null,
                    last_message_sender_id: row?.last_message_sender_id ?? null,
                    unread_count: Number(row?.unread_count ?? 0)
                });
            });
            return new _paginationResultdto.PaginationResultDto('channels', _channelsmapper.ChannelsMapper.toChannelResponseDtoList(enriched), total, page, limit);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getChannel(channelId, currentUserId) {
        const channel = await this.findByChannelId(channelId, currentUserId);
        return _channelsmapper.ChannelsMapper.toChannelResponseDto(channel);
    }
    async findByChannelId(channelId, currentUserId) {
        const query = this.baseChannelsQuery(currentUserId).where('channel.id = :channelId', {
            channelId
        });
        const { entities, raw } = await query.getRawAndEntities();
        const channel = entities[0];
        if (!channel) {
            throw new _common.BadRequestException('Kênh trò chuyện không tồn tại');
        }
        const row = raw.find((r)=>Number(r.channel_id ?? r['channel_id']) === channel.id);
        return Object.assign(channel, {
            last_message_content: row?.last_message_content ?? null,
            last_message_created_at: row?.last_message_created_at ?? null,
            last_message_sender_id: row?.last_message_sender_id ?? null,
            unread_count: Number(row?.unread_count ?? 0)
        });
    }
    async findByChannelIdTransaction(manager, channelId) {
        const channel = await manager.findOne(_channelentity.default, {
            where: {
                id: channelId
            },
            relations: [
                'participants',
                'participants.user'
            ]
        });
        if (!channel) {
            throw new _common.BadRequestException('Kênh trò chuyện không tồn tại');
        }
        return channel;
    }
    async findChannelByExactMemberIds(memberIds) {
        const existingChannel = await this.channelRepo.createQueryBuilder('channel').innerJoin('channel.participants', 'participant').innerJoin('participant.user', 'user').groupBy('channel.id').having('COUNT(DISTINCT user.id) = :count', {
            count: memberIds.length
        }).andHaving('COUNT(DISTINCT CASE WHEN user.id IN (:...memberIds) THEN user.id END) = :count', {
            count: memberIds.length,
            memberIds
        }).getOne();
        if (!existingChannel) {
            return null;
        }
        return this.findByChannelId(existingChannel.id);
    }
    async isChannelExists(userId, channelId) {
        const channel = await this.channelRepo.findOne({
            where: {
                id: channelId,
                participants: {
                    user: {
                        id: userId
                    }
                }
            }
        });
        return !!channel;
    }
    baseChannelsQuery(currentUserId) {
        const query = this.channelRepo.createQueryBuilder('channel').leftJoinAndSelect('channel.participants', 'participant').leftJoinAndSelect('participant.user', 'user').addSelect((qb)=>qb.select('m.content').from('messages', 'm').where('m.channel_id = channel.id').andWhere('m.deleted_at IS NULL').orderBy('m.created_at', 'DESC').limit(1), 'last_message_content').addSelect((qb)=>qb.select('m.created_at').from('messages', 'm').where('m.channel_id = channel.id').andWhere('m.deleted_at IS NULL').orderBy('m.created_at', 'DESC').limit(1), 'last_message_created_at').addSelect((qb)=>qb.select('m.sender_id').from('messages', 'm').where('m.channel_id = channel.id').andWhere('m.deleted_at IS NULL').orderBy('m.created_at', 'DESC').limit(1), 'last_message_sender_id');
        if (currentUserId) {
            query.addSelect((qb)=>qb.select('COUNT(*)').from('messages', 'm').where('m.channel_id = channel.id').andWhere('m.deleted_at IS NULL').andWhere('m.is_read = false').andWhere('m.sender_id <> :currentUserId'), 'unread_count').setParameter('currentUserId', currentUserId);
        } else {
            query.addSelect('0', 'unread_count');
        }
        return query;
    }
    buildTotalChannelsQuery(userId, search) {
        const totalQuery = this.channelRepo.createQueryBuilder('channel').where((qb)=>{
            const subQuery = qb.subQuery().select('cm.channel_id').from('channel_members', 'cm').where('cm.participant_id = :userId');
            return `channel.id IN ${subQuery.getQuery()}`;
        }).setParameter('userId', userId);
        if (search) {
            totalQuery.andWhere((qb)=>{
                const searchSubQuery = qb.subQuery().select('1').from('channel_members', 'cm_search').innerJoin('users', 'u_search', 'u_search.id = cm_search.participant_id').where('cm_search.channel_id = channel.id').andWhere('u_search.id != :userId').andWhere('(u_search.username ILIKE :search OR u_search.fullname ILIKE :search)').getQuery();
                return `EXISTS ${searchSubQuery}`;
            });
            totalQuery.setParameter('search', `%${search}%`);
        }
        return totalQuery;
    }
    constructor(channelRepo, usersService, dataSource){
        this.channelRepo = channelRepo;
        this.usersService = usersService;
        this.dataSource = dataSource;
    }
};
ChannelsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_channelentity.default)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _typeorm1.DataSource === "undefined" ? Object : _typeorm1.DataSource
    ])
], ChannelsService);

//# sourceMappingURL=channels.service.js.map