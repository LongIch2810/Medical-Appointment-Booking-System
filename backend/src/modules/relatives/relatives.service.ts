import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, QueryFailedError, Repository } from 'typeorm';
import Relative from 'src/entities/relative.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';
import { BodyCreateRelativeDto } from './dto/request/bodyCreateRelative.dto';
import { BodyFilterRelativesDto } from './dto/request/bodyFilterRelatives.dto';
import { UsersService } from '../users/users.service';
import { BodyUpdateRelativeDto } from './dto/request/bodyUpdateRelative.dto';
import { RelativesMapper } from './relatives.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

@Injectable()
export class RelativesService {
  constructor(
    @InjectRepository(Relative)
    private readonly relativeRepo: Repository<Relative>,
    private readonly usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async create(userId: number, createRelativeDto: BodyCreateRelativeDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const { relationship_code, ...rest } = createRelativeDto;
        const relationship = await manager.findOne(Relationship, {
          where: { relationship_code: relationship_code },
        });

        if (!relationship) {
          throw new NotFoundException('Mã mối quan hệ không tồn tại');
        }

        const isExists = await this.isRelativeExists(
          userId,
          rest.fullname,
          relationship_code,
        );

        if (isExists) {
          throw new ConflictException('Người thân đã tồn tại trong hệ thống!');
        }

        const createdRelative = manager.create(Relative, {
          ...rest,
          user: { id: userId },
          relationship: { relationship_code: relationship_code },
        });
        await manager.save(Relative, createdRelative);

        const newHealthProfile = manager.create(HealthProfile, {
          patient: { id: createdRelative.id },
        });
        await manager.save(HealthProfile, newHealthProfile);
        const newRelative = await this.getRelativeDetail(
          userId,
          createdRelative.id,
        );
        return newRelative;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Người thân đã tồn tại trong hệ thống!');
      }
      throw error;
    }
  }

  async filterAndPagination(objectFilters: BodyFilterRelativesDto) {
    let { page, limit, search, relationshipCode, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const query = this.baseRelativesQuery().orderBy(
      'relative.created_at',
      arrange.toUpperCase() as 'ASC' | 'DESC',
    );

    if (search) {
      query.andWhere('lower(relative.fullname) LIKE lower(:search)', {
        search: `%${search}%`,
      });
      query.orWhere('relative.phone LIKE :search', {
        search: `%${search}%`,
      });
      query.orWhere(
        'lower(relationship.relationship_name) LIKE lower(:search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (relationshipCode) {
      query.andWhere(
        'lower(relative.relationship_code) = lower(:relationshipCode)',
        {
          relationshipCode,
        },
      );
    }

    const [relatives, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginationResultDto(
      'relatives',
      RelativesMapper.toRelativeResponseDtoList(relatives),
      total,
      page,
      limit,
    );
  }

  async findRelativesByUserId(
    userId: number,
    objectFilters: BodyFilterRelativesDto,
  ) {
    let { page, limit, search, relationshipCode, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;
    const isUserExists = await this.usersService.isUserExists(userId);
    if (!isUserExists) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const query = this.baseRelativesQuery()
      .orderBy('relative.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .where('user.id = :userId', { userId });
    if (search) {
      query.andWhere('lower(relative.fullname) LIKE lower(:search)', {
        search: `%${search}%`,
      });
      query.orWhere('relative.phone LIKE :search', {
        search: `%${search}%`,
      });
      query.orWhere(
        'lower(relationship.relationship_name) LIKE lower(:search)',
        {
          search: `%${search}%`,
        },
      );
    }
    if (relationshipCode) {
      query.andWhere(
        'lower(relative.relationship_code) = lower(:relationshipCode)',
        {
          relationshipCode,
        },
      );
    }
    const [relatives, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return new PaginationResultDto(
      'relatives',
      RelativesMapper.toRelativeResponseDtoList(relatives),
      total,
      page,
      limit,
    );
  }

  async findOwnedByUserId(userId: number, relativeId: number) {
    const relative = await this.relativeRepo.findOne({
      where: {
        id: relativeId,
        user: { id: userId },
      },
      relations: ['relationship', 'health_profile', 'user'],
    });

    if (!relative) {
      throw new NotFoundException(
        'Người thân không tồn tại hoặc không thuộc quyền quản lý của bạn.',
      );
    }

    return relative;
  }

  async update(
    userId: number,
    relativeId: number,
    bodyUpdateRelative: BodyUpdateRelativeDto,
  ) {
    const relative = await this.findOwnedByUserId(userId, relativeId);

    if (bodyUpdateRelative.relationship_code) {
      const relationship = await this.dataSource.manager.findOne(Relationship, {
        where: {
          relationship_code: bodyUpdateRelative.relationship_code,
        },
      });

      if (!relationship) {
        throw new NotFoundException('Mã mối quan hệ không tồn tại');
      }

      relative.relationship = relationship;
    }

    if (bodyUpdateRelative.fullname) {
      relative.fullname = bodyUpdateRelative.fullname;
    }

    if (bodyUpdateRelative.phone) {
      relative.phone = bodyUpdateRelative.phone;
    }

    if (bodyUpdateRelative.dob) {
      relative.dob = new Date(bodyUpdateRelative.dob);
    }

    if (bodyUpdateRelative.gender) {
      relative.gender = bodyUpdateRelative.gender;
    }

    return this.relativeRepo.save(relative);
  }

  async remove(userId: number, relativeId: number) {
    const relative = await this.findOwnedByUserId(userId, relativeId);

    await this.relativeRepo.softDelete(relative.id);
    return { message: 'Xóa người thân thành công' };
  }

  async getRelativeDetail(userId: number, relativeId: number) {
    const relative = await this.findOwnedByUserId(userId, relativeId);
    return RelativesMapper.toRelativeResponseDto(relative);
  }

  async isRelativeExists(
    userId: number,
    fullname: string,
    relationship_code: string,
  ): Promise<boolean> {
    const relative = await this.relativeRepo.findOne({
      where: {
        user: { id: userId },
        fullname: ILike(fullname),
        relationship: { relationship_code: relationship_code },
      },
    });
    return !!relative;
  }

  async isRelativeExistsByRelativeId(
    userId: number,
    relativeId: number,
  ): Promise<boolean> {
    const relative = await this.relativeRepo.findOne({
      where: { id: relativeId, user: { id: userId } },
    });
    return !!relative;
  }

  async numberOfRelativesByUserId(userId: number) {
    const count = await this.relativeRepo.count({
      where: {
        user: { id: userId },
      },
    });
    return count;
  }

  private baseRelativesQuery() {
    return this.relativeRepo
      .createQueryBuilder('relative')
      .leftJoinAndSelect('relative.user', 'user')
      .leftJoinAndSelect('relative.relationship', 'relationship')
      .select([
        'relative.id',
        'relative.fullname',
        'relative.phone',
        'relative.dob',
        'relative.gender',
        'relative.created_at',
        'relationship.relationship_name',
        'relationship.relationship_code',
      ]);
  }
}
