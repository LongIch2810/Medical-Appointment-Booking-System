import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import HealthProfile from 'src/entities/healthProfile.entity';
import { BodyUpdateHealthProfileDto } from './dto/request/bodyUpdateHealthProfile.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RelativesService } from '../relatives/relatives.service';
import { UsersService } from '../users/users.service';
import { BodyFilterHealthProfilesDto } from './dto/request/bodyFilterHealthProfiles.dto';
import { HealthProfileMapper } from './health-profile.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

@Injectable()
export class HealthProfileService {
  constructor(
    @InjectRepository(HealthProfile)
    private readonly healthProfileRepo: Repository<HealthProfile>,
    private readonly relativesService: RelativesService,
    private readonly redisCacheService: RedisCacheService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: number, relativeId: number) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const relative = await this.relativesService.findOwnedByUserId(
      userId,
      relativeId,
    );

    if (relative.health_profile) {
      throw new ConflictException(
        'Hồ sơ sức khỏe đã tồn tại trong hệ thống. Vui lòng dùng tính năng Cập nhật.',
      );
    }

    const createdHealthProfile = this.healthProfileRepo.create({
      patient: { id: relativeId },
    });

    const newHealthProfile =
      await this.healthProfileRepo.save(createdHealthProfile);

    return HealthProfileMapper.toHealthProfileResponseDto(newHealthProfile);
  }

  async update(
    userId: number,
    relativeId: number,
    bodyUpdateHealthProfile: Partial<BodyUpdateHealthProfileDto>,
  ) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const relative = await this.relativesService.findOwnedByUserId(
      userId,
      relativeId,
    );

    if (!relative.health_profile) {
      throw new ConflictException(
        'Bệnh nhân này đang bị lỗi rỗng hồ sơ sức khỏe. Vui lòng liên hệ Admin.',
      );
    }

    await this.healthProfileRepo.update(
      relative.health_profile.id,
      bodyUpdateHealthProfile,
    );

    return { message: 'Cập nhật hồ sơ sức khỏe thành công.' };
  }

  async getHealthProfile(userId: number, relativeId: number) {
    await this.relativesService.findOwnedByUserId(userId, relativeId);

    const healthProfile = await this.baseHealthProfileQuery()
      .where('relative.id = :relativeId', { relativeId })
      .getOne();

    if (!healthProfile) {
      throw new NotFoundException('Hồ sơ sức khỏe không tồn tại.');
    }

    return HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
  }

  async listHealthProfilesByUserId(
    userId: number,
    objectFilters: BodyFilterHealthProfilesDto,
  ) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    let { page, limit, arrange, search } = objectFilters;

    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.baseHealthProfileQuery()
      .where('user.id = :userId', { userId })
      .orderBy(
        'health_profile.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (search) {
      query.where('LOWER(relative.fullname) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
      query.orWhere('relative.phone LIKE :search', {
        search: `%${search}%`,
      });
      query.orWhere('LOWER(user.fullname) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const [healthProfiles, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginationResultDto(
      'healthProfiles',
      HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles),
      total,
      page,
      limit,
    );
  }

  async filterAndPagination(objectFilters: BodyFilterHealthProfilesDto) {
    let { page, limit, search, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.baseHealthProfileQuery()
      .orderBy(
        'health_profile.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    if (search) {
      query.where('LOWER(relative.fullname) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
      query.orWhere('relative.phone LIKE :search', {
        search: `%${search}%`,
      });
      query.orWhere('LOWER(user.fullname) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const [healthProfiles, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginationResultDto(
      'healthProfiles',
      HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles),
      total,
      page,
      limit,
    );
  }

  async getHealthProfileByRelativeId(userId: number, relativeId: number) {
    await this.relativesService.findOwnedByUserId(userId, relativeId);

    const healthProfile = await this.baseHealthProfileQuery()
      .where('relative.id = :relativeId', { relativeId })
      .getOne();

    if (!healthProfile) {
      throw new NotFoundException('Hồ sơ sức khỏe không tồn tại.');
    }

    return HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
  }

  async getPersonalHealthProfile(userId: number) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const healthProfile = await this.baseHealthProfileQuery()
      .orderBy('health_profile.created_at', 'ASC')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!healthProfile) {
      throw new NotFoundException('Hồ sơ sức khỏe không tồn tại.');
    }
    return HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
  }

  async numberOfHealthProfilesByUserId(userId: number) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const count = await this.healthProfileRepo.count({
      where: {
        patient: {
          user: { id: userId },
        },
      },
    });
    return count;
  }

  private baseHealthProfileQuery() {
    return this.healthProfileRepo
      .createQueryBuilder('health_profile')
      .leftJoinAndSelect('health_profile.patient', 'relative')
      .leftJoinAndSelect('relative.user', 'user')
      .leftJoinAndSelect('relative.relationship', 'relationship')
      .select([
        'health_profile.id',
        'health_profile.weight',
        'health_profile.height',
        'health_profile.blood_type',
        'health_profile.medical_history',
        'health_profile.allergies',
        'health_profile.heart_rate',
        'health_profile.blood_pressure',
        'health_profile.glucose_level',
        'health_profile.cholesterol_level',
        'health_profile.medications',
        'health_profile.vaccinations',
        'health_profile.smoking',
        'health_profile.alcohol_consumption',
        'health_profile.exercise_frequency',
        'health_profile.last_checkup_date',
        'relative.id',
        'relative.fullname',
        'relative.gender',
        'relative.dob',
        'relative.phone',
        'relationship.relationship_code',
        'relationship.relationship_name',
        'user.id',
        'user.fullname',
      ]);
  }
}
