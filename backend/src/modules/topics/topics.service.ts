import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Topic from 'src/entities/topic.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { BodyFilterTopicsDto } from './dto/request/bodyFilterTopics.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { BodyCreateTopicDto } from './dto/request/bodyCreateTopic.dto';
import { generateSlug } from 'src/utils/generateSlug';
import { TopicMapper } from './topic.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { TopicResponseDto } from './dto/response/topicResponse.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private readonly topicRepo: Repository<Topic>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(body: BodyCreateTopicDto) {
    try {
      const { name, description } = body;
      const slug = generateSlug(name);
      const isTopicExistsByName = await this.isTopicExistsByName(name);
      if (isTopicExistsByName) {
        throw new ConflictException('Topic đã tồn tại');
      }
      const isTopicExistsBySlug = await this.isTopicExistsBySlug(slug);
      if (isTopicExistsBySlug) {
        throw new ConflictException('Topic đã tồn tại');
      }
      const topic = this.topicRepo.create({ name, description, slug });
      const newTopic = await this.topicRepo.save(topic);
      return TopicMapper.toTopicResponse(newTopic);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Topic đã tồn tại');
      }
      throw error;
    }
  }

  async update(topicId: number, body: Partial<BodyCreateTopicDto>) {
    const topic = await this.findById(topicId);

    const nextName = body.name?.trim();
    const nextDescription = body.description?.trim();

    if (nextName && nextName !== topic.name) {
      const slug = generateSlug(nextName);
      const isTopicExistsByName = await this.topicRepo
        .createQueryBuilder('topic')
        .where('LOWER(topic.name) = LOWER(:name)', { name: nextName })
        .andWhere('topic.id != :topicId', { topicId })
        .getOne();

      const isTopicExistsBySlug = await this.topicRepo
        .createQueryBuilder('topic')
        .where('topic.slug = :slug', { slug })
        .andWhere('topic.id != :topicId', { topicId })
        .getOne();

      if (isTopicExistsByName || isTopicExistsBySlug) {
        throw new ConflictException('Topic đã tồn tại');
      }

      topic.name = nextName;
      topic.slug = slug;
    }

    if (nextDescription) {
      topic.description = nextDescription;
    }

    return this.topicRepo.save(topic);
  }

  async filterAndPagination(objectFilters: BodyFilterTopicsDto) {
    let { page, limit, search, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `topics:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const query = this.topicRepo
      .createQueryBuilder('topic')
      .where('topic.deleted_at is NULL')
      .orderBy('topic.name', arrange.toUpperCase() as 'ASC' | 'DESC')
      .take(limit)
      .skip(skip);

    if (search) {
      query.andWhere(`LOWER(topic.name) LIKE LOWER(:search)`, {
        search: `%${search}%`,
      });
    }

    const [topics, total] = await query.getManyAndCount();

    const result = new PaginationResultDto<TopicResponseDto>(
      'topics',
      TopicMapper.toTopicListResponse(topics),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result);

    return result;
  }

  async isTopicExistsByName(name: string) {
    return this.topicRepo.findOne({ where: { name } });
  }

  async isTopicExistsBySlug(slug: string) {
    return this.topicRepo.findOne({ where: { slug } });
  }

  async findById(topicId: number) {
    const topic = await this.topicRepo.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException('Topic không tồn tại');
    }
    return topic;
  }

  async getTopic(topicId: number) {
    const topic = await this.findById(topicId);
    return TopicMapper.toTopicResponse(topic);
  }

  async remove(topicId: number) {
    await this.findById(topicId);
    await this.topicRepo.softDelete(topicId);
    return { message: 'Xóa topic thành công' };
  }
}
