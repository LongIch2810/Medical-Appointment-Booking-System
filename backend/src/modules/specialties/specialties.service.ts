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
import { BodyCreateSpecialtyDto } from './dto/request/bodyCreateSpecialty.dto';
import { generateSlug } from 'src/utils/generateSlug';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(Specialty) private specialtyRepo: Repository<Specialty>,
    private redisCacheService: RedisCacheService,
  ) {}

  async createSpecialty(bodyCreateSpecialty: BodyCreateSpecialtyDto) {
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

      await this.specialtyRepo.save({
        description,
        name,
        slug,
        img_url,
      });

      return { message: 'Tạo chuyên khoa thành công.' };
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

  async updateSpecialty(
    specialtyId: number,
    bodyUpdateSpecialty: Partial<BodyUpdateSpecialtyDto>,
  ) {}

  async deleteSpecialty(specialtyId: number) {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    await this.specialtyRepo.softDelete(specialtyId);

    return { message: 'Xóa chuyên khoa thành công.' };
  }

  async getSpecialty(specialtyId: number) {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    return specialty;
  }

  async filterAndPagination(objectFilter: BodyFilterSpecialtiesDto) {
    let { page, limit, search, arrange } = objectFilter;
    const cacheKey = `specialties:page=${page}:limit=${limit}:filter=${objectFilter || {}}`;
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
      query.where(
        'UNACCENT(LOWER(specialty.name)) LIKE UNACCENT(LOWER(:search))',
        { search: search },
      );
    }

    const [specialties, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    const result = {
      specialties,
      total,
      totalPages,
      limit,
      page,
    };

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
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
