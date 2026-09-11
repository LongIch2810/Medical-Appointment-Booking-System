import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import CoachProfile from 'src/entities/coachProfile.entity';
import { BodyCreateCoachProfileDto } from './dto/request/bodyCreateCoachProfile.dto';
import { BodyUpdateCoachProfileDto } from './dto/request/bodyUpdateCoachProfile.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UsersService } from '../users/users.service';
import { CoachProfileMapper } from './coach-profile.mapper';

@Injectable()
export class CoachProfileService {
  constructor(
    @InjectRepository(CoachProfile)
    private readonly coachProfileRepo: Repository<CoachProfile>,
    private readonly usersService: UsersService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  private cacheKey(userId: number) {
    return `coachProfile:user:${userId}`;
  }

  async create(userId: number, dto: BodyCreateCoachProfileDto) {
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    const existing = await this.coachProfileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (existing) {
      throw new ConflictException(
        'Hồ sơ huấn luyện viên AI đã tồn tại. Vui lòng dùng tính năng Cập nhật.',
      );
    }

    const created = this.coachProfileRepo.create({
      ...dto,
      user: { id: userId },
    });
    const saved = await this.coachProfileRepo.save(created);

    await this.redisCacheService.delData(this.cacheKey(userId));

    return CoachProfileMapper.toCoachProfileResponseDto(saved);
  }

  async update(userId: number, dto: BodyUpdateCoachProfileDto) {
    const coachProfile = await this.coachProfileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!coachProfile) {
      throw new NotFoundException('Hồ sơ huấn luyện viên AI không tồn tại.');
    }

    Object.assign(coachProfile, dto);
    const saved = await this.coachProfileRepo.save(coachProfile);

    await this.redisCacheService.delData(this.cacheKey(userId));

    return CoachProfileMapper.toCoachProfileResponseDto(saved);
  }

  async getByUserId(userId: number) {
    const cacheKey = this.cacheKey(userId);
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;

    const coachProfile = await this.coachProfileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!coachProfile) {
      throw new NotFoundException('Hồ sơ huấn luyện viên AI không tồn tại.');
    }

    const result = CoachProfileMapper.toCoachProfileResponseDto(coachProfile);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
}
