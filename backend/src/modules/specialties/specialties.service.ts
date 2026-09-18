import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { QueryFailedError, Repository } from 'typeorm';
import { BodyUpdateSpecialtyDto } from './dto/request/bodyUpdateSpecialty.dto';
import { BodyFilterSpecialtiesDto } from './dto/request/bodyFilterSpecialties.dto';
import { startOfNextDay } from 'src/utils/filterDate';
import { BodyCreateSpecialtyDto } from './dto/request/bodyCreateSpecialty.dto';
import { generateSlug } from 'src/utils/generateSlug';
import { SpecialtiesMapper } from './specialties.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty) private specialtyRepo: Repository<Specialty>,
    private redisCacheService: RedisCacheService,
  ) {}

  async create(bodyCreateSpecialty: BodyCreateSpecialtyDto) {
    try {
      const { description, name, img_url } = bodyCreateSpecialty;
      const slug = generateSlug(name);
      const isSpecialtyExistsByName = await this.isSpecialtyExistsByName(name);
      const isSpecialtyExistsBySlug = await this.isSpecialtyExistsBySlug(slug);
      if (isSpecialtyExistsByName || isSpecialtyExistsBySlug) {
        throw new ConflictException('Chuyên khoa đã tồn tại.');
      }

      if (!img_url) {
        throw new BadRequestException('Ảnh chuyên khoa là bắt buộc.');
      }

      const newSpecialty = await this.specialtyRepo.save({
        description,
        name,
        slug,
        img_url,
      });
      const specialtyDetail = await this.getSpecialtyDetail(newSpecialty.id);
      await this.redisCacheService.delByPrefix('specialties:');
      return specialtyDetail;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Chuyên khoa đã tồn tại');
      }

      throw error;
    }
  }

  async update(
    specialtyId: number,
    bodyUpdateSpecialty: BodyUpdateSpecialtyDto,
  ) {
    const specialty = await this.findSpecialtyById(specialtyId);

    if (
      bodyUpdateSpecialty.name !== undefined &&
      bodyUpdateSpecialty.name !== specialty.name
    ) {
      const slug = generateSlug(bodyUpdateSpecialty.name);
      const existedSpecialty = await this.specialtyRepo
        .createQueryBuilder('specialty')
        .where(
          '(LOWER(specialty.name) = LOWER(:name) OR specialty.slug = :slug)',
          { name: bodyUpdateSpecialty.name, slug },
        )
        .andWhere('specialty.id != :specialtyId', { specialtyId })
        .getOne();

      if (existedSpecialty) {
        throw new ConflictException('Chuyên khoa đã tồn tại.');
      }

      specialty.name = bodyUpdateSpecialty.name;
      specialty.slug = slug;
    }

    if (bodyUpdateSpecialty.description !== undefined) {
      specialty.description = bodyUpdateSpecialty.description;
    }

    if (bodyUpdateSpecialty.img_url !== undefined) {
      specialty.img_url = bodyUpdateSpecialty.img_url;
    }

    const updatedSpecialty = await this.specialtyRepo.save(specialty);
    await this.redisCacheService.delByPrefix('specialties:');
    await this.redisCacheService.delData(`specialty:${specialtyId}`);
    return SpecialtiesMapper.toSpecialtyResponseDto(updatedSpecialty);
  }

  async delete(specialtyId: number) {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    await this.specialtyRepo.softDelete(specialtyId);

    await this.redisCacheService.delByPrefix('specialties:');
    await this.redisCacheService.delData(`specialty:${specialtyId}`);

    return { message: 'Xóa chuyên khoa thành công.' };
  }

  async getSpecialtyDetail(specialtyId: number) {
    const cacheKey = `specialty:${specialtyId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const specialty = await this.findSpecialtyById(specialtyId);
    const result = SpecialtiesMapper.toSpecialtyResponseDto(specialty);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }

  async filterAndPagination(objectFilter: BodyFilterSpecialtiesDto) {
    let { page, limit } = objectFilter;
    const { search, createdFrom, createdTo, arrange } = objectFilter;
    if (
      createdFrom &&
      createdTo &&
      new Date(createdFrom) > new Date(createdTo)
    ) {
      throw new BadRequestException('createdFrom must be before createdTo');
    }
    const cacheKey = `specialties:page=${page}:limit=${limit}:filter=${JSON.stringify(objectFilter || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    page = Math.max(1, page);
    limit = Math.max(1, limit);

    const skip = (page - 1) * limit;

    const query = this.specialtyRepo
      .createQueryBuilder('specialty')
      .where('specialty.deleted_at is NULL')
      .orderBy('specialty.name', arrange.toUpperCase() as 'ASC' | 'DESC')
      .take(limit)
      .skip(skip);

    if (search) {
      query.andWhere(
        'UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (createdFrom) {
      query.andWhere('specialty.created_at >= :createdFrom', {
        createdFrom: new Date(createdFrom),
      });
    }
    if (createdTo) {
      query.andWhere('specialty.created_at < :createdTo', {
        createdTo: startOfNextDay(createdTo),
      });
    }

    const [specialties, total] = await query.getManyAndCount();

    const result = new PaginationResultDto(
      'specialties',
      specialties,
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }

  async findSpecialtyById(specialtyId: number) {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    return specialty;
  }

  async isSpecialtyExistsByName(name: string) {
    const specialty = await this.specialtyRepo.findOne({
      where: { name },
    });
    return !!specialty;
  }

  async isSpecialtyExistsBySlug(slug: string) {
    const specialty = await this.specialtyRepo.findOne({
      where: { slug },
    });
    return !!specialty;
  }
}
