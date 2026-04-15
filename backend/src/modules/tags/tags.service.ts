import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Tag from 'src/entities/tag.entity';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { BodyCreateTagDto } from './dto/request/bodyCreateTag.dto';
import { BodyFilterTagsDto } from './dto/request/bodyFilterTags.dto';
import { generateSlug } from 'src/utils/generateSlug';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
  ) {}

  async create(body: BodyCreateTagDto) {
    try {
      const name = body.name;
      const slug = generateSlug(name);

      const existsTag = await this.isTagExistsByName(name);
      const existsSlug = await this.isTagExistsBySlug(slug);

      if (existsTag || existsSlug) {
        throw new ConflictException('Tag đã tồn tại');
      }

      const createdTag = this.tagRepo.create({ name, slug });
      const newTag = await this.tagRepo.save(createdTag);
      return newTag;
    } catch (error: any) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Tag đã tồn tại');
      }
      throw error;
    }
  }

  async update(tagId: number, body: Partial<BodyCreateTagDto>) {
    const tag = await this.findById(tagId);

    if (!body.name || body.name === tag.name) {
      return tag;
    }

    const name = body.name;
    const slug = generateSlug(name);

    const existedTag = await this.tagRepo
      .createQueryBuilder('tag')
      .where('LOWER(tag.name) = LOWER(:name)', { name })
      .andWhere('tag.id != :tagId', { tagId })
      .getOne();

    const existedSlug = await this.tagRepo
      .createQueryBuilder('tag')
      .where('tag.slug = :slug', { slug })
      .andWhere('tag.id != :tagId', { tagId })
      .getOne();

    if (existedTag || existedSlug) {
      throw new ConflictException('Tag đã tồn tại');
    }

    tag.name = name;
    tag.slug = slug;
    return this.tagRepo.save(tag);
  }

  async filterAndPagination(objectFilters: BodyFilterTagsDto) {
    let { page, limit, search, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;
    const query = this.tagRepo
      .createQueryBuilder('tag')
      .orderBy('tag.name', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.where('tag.name ILIKE :search', { search: `%${search}%` });
      query.orWhere('tag.slug ILIKE :search', { search: `%${search}%` });
    }

    const [tags, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      tags,
      total,
      page,
      totalPages,
      limit,
    };
  }

  async isTagExistsByName(name: string): Promise<boolean> {
    const tag = await this.tagRepo.findOne({ where: { name: ILike(name) } });
    return !!tag;
  }

  async isTagExistsBySlug(slug: string): Promise<boolean> {
    const tag = await this.tagRepo.findOne({ where: { slug } });
    return !!tag;
  }

  async findById(tagId: number) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException('Tag không tồn tại');
    }
    return tag;
  }

  async remove(tagId: number) {
    await this.findById(tagId);
    await this.tagRepo.softDelete(tagId);
    return { message: 'Xóa tag thành công' };
  }
}
