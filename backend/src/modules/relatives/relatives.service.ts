import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  ILike,
  QueryFailedError,
  Repository,
} from 'typeorm';
import Relative from 'src/entities/relative.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';
import { BodyCreateRelativeDto } from './dto/request/bodyCreateRelative.dto';
import { BodyFilterRelativesDto } from './dto/request/bodyFilterRelatives.dto';
import { UsersService } from '../users/users.service';
import { BodyUpdateRelativeDto } from './dto/request/bodyUpdateRelative.dto';
import { RelativesMapper } from './relatives.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { RelationshipsService } from '../relationships/relationships.service';
import { isPgDriverError } from '../../utils/isPgDriverError';
import { RoleName } from 'src/shared/enums/roleName';

@Injectable()
export class RelativesService {
  constructor(
    @InjectRepository(Relative)
    private readonly relativeRepo: Repository<Relative>,
    private readonly usersService: UsersService,
    private readonly relationshipsService: RelationshipsService,
    private dataSource: DataSource,
  ) {}

  async create(userId: number, createRelativeDto: BodyCreateRelativeDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const { relationship_code, phone, fullname } = createRelativeDto;
        const relationship = await manager.findOne(Relationship, {
          where: { relationship_code: relationship_code },
        });

        if (!relationship) {
          throw new NotFoundException('Mã mối quan hệ không tồn tại');
        }

        if (phone) {
          const isExists = await this.isRelativeExists(
            userId,
            fullname,
            relationship_code,
            phone,
          );

          if (isExists) {
            throw new ConflictException(
              'Người thân đã tồn tại trong hệ thống!',
            );
          }
        }

        const saved = await this.insertRelativeWithHealthProfile(
          manager,
          userId,
          createRelativeDto,
        );
        const relative = await this.findOwnedByUserIdTransaction(
          manager,
          userId,
          saved.id,
        );
        return RelativesMapper.toRelativeResponseDto(relative);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        isPgDriverError(error.driverError) &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Người thân đã tồn tại trong hệ thống!');
      }
      throw error;
    }
  }

  async filterAndPagination(objectFilters: BodyFilterRelativesDto) {
    let { page, limit } = objectFilters;
    const { search, relationshipCode, arrange } = objectFilters;
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
    let { page, limit } = objectFilters;
    const { search, relationshipCode, arrange } = objectFilters;
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
      query.andWhere(
        new Brackets((qb) => {
          qb.where('lower(relative.fullname) LIKE lower(:search)', {
            search: `%${search}%`,
          })
            .orWhere('relative.phone LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere(
              'lower(relationship.relationship_name) LIKE lower(:search)',
              {
                search: `%${search}%`,
              },
            );
        }),
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

  async findOwnedByUserId(
    userId: number,
    relativeId: number,
    actorRoles: string[] = [],
  ) {
    const isAdmin = actorRoles.includes(RoleName.ADMIN);
    const relative = await this.relativeRepo.findOne({
      where: {
        id: relativeId,
        ...(isAdmin ? {} : { user: { id: userId } }),
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
    actorRoles: string[] = [],
  ) {
    try {
      const relative = await this.findOwnedByUserId(
        userId,
        relativeId,
        actorRoles,
      );

      if (bodyUpdateRelative.relationship_code) {
        const relationship =
          await this.relationshipsService.findByRelationshipCode(
            bodyUpdateRelative.relationship_code,
          );

        relative.relationship = relationship;
      }

      Object.assign(relative, bodyUpdateRelative);

      const savedRelative = await this.relativeRepo.save(relative);
      return RelativesMapper.toRelativeResponseDto(savedRelative);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        isPgDriverError(error.driverError) &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống!');
      }
      throw error;
    }
  }

  async remove(
    userId: number,
    relativeId: number,
    actorRoles: string[] = [],
  ) {
    const relative = await this.findOwnedByUserId(
      userId,
      relativeId,
      actorRoles,
    );
    const response = RelativesMapper.toRelativeResponseDto(relative);
    await this.relativeRepo.softDelete(relativeId);
    return response;
  }

  async getRelativeDetail(
    userId: number,
    relativeId: number,
    actorRoles: string[] = [],
  ) {
    const relative = await this.findOwnedByUserId(
      userId,
      relativeId,
      actorRoles,
    );
    return RelativesMapper.toRelativeResponseDto(relative);
  }

  async isRelativeExists(
    userId: number,
    fullname: string,
    relationship_code: string,
    phone: string,
  ): Promise<boolean> {
    const relative = await this.relativeRepo.findOne({
      where: {
        user: { id: userId },
        fullname: ILike(fullname),
        relationship: { relationship_code: relationship_code },
        phone: phone,
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

  /**
   * Dùng cho luồng đặt lịch: tái sử dụng thân nhân đã tồn tại nếu khớp
   * (fullname + relationship_code + phone), ngược lại tạo mới (Relative +
   * HealthProfile rỗng đi kèm). Nhận `manager` từ transaction của caller
   * (không tự mở transaction riêng) để việc tạo thân nhân và đặt lịch cùng
   * commit/rollback với nhau.
   */
  async findOrCreateForBooking(
    manager: EntityManager,
    userId: number,
    dto: BodyCreateRelativeDto,
  ): Promise<Relative> {
    const { relationship_code, phone, fullname } = dto;

    const relationship = await manager.findOne(Relationship, {
      where: { relationship_code },
    });
    if (!relationship) {
      throw new NotFoundException('Mã mối quan hệ không tồn tại');
    }

    if (phone) {
      // pessimistic_write khóa row trùng khớp (nếu có) trong transaction của
      // caller, để hai request đặt lịch đồng thời với cùng new_relative_profile
      // không thể cùng resolve ra một Relative chưa được lock, gây double-booking.
      //
      // KHÔNG được join thêm relationship/health_profile (leftJoinAndSelect)
      // vào cùng câu query có setLock('pessimistic_write') — Postgres từ chối
      // "FOR UPDATE" khi có LEFT JOIN vì bảng phía ngoài join có thể ra NULL
      // ("FOR UPDATE cannot be applied to the nullable side of an outer
      // join"), lỗi này chỉ lộ ra khi chạy trên Postgres thật, không phát
      // hiện được qua unit test mock query builder. relationship_code đã là
      // cột thật ngay trên bảng relatives (xem @JoinColumn trên
      // Relative.relationship) nên lọc trực tiếp không cần join. Không cần
      // eager-load relationship/health_profile ở đây vì giá trị trả về chỉ
      // dùng làm `patient` (FK theo id) khi tạo Appointment — giống hệt
      // nhánh "tạo mới" bên dưới cũng không eager-load 2 quan hệ này.
      const existing = await manager
        .getRepository(Relative)
        .createQueryBuilder('relative')
        .setLock('pessimistic_write')
        .where('relative.user.id = :userId', { userId })
        .andWhere('relative.fullname ILIKE :fullname', { fullname })
        .andWhere('relative.relationship_code = :relationship_code', {
          relationship_code,
        })
        .andWhere('relative.phone = :phone', { phone })
        .getOne();
      if (existing) return existing;
    }

    try {
      return await this.insertRelativeWithHealthProfile(manager, userId, dto);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        isPgDriverError(error.driverError) &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống.');
      }
      throw error;
    }
  }

  private async insertRelativeWithHealthProfile(
    manager: EntityManager,
    userId: number,
    dto: BodyCreateRelativeDto,
  ): Promise<Relative> {
    const { relationship_code, phone, fullname, ...rest } = dto;
    const createdRelative = manager.create(Relative, {
      ...rest,
      fullname,
      phone: phone ?? null,
      user: { id: userId },
      relationship: { relationship_code },
    });
    const saved = await manager.save(Relative, createdRelative);

    const newHealthProfile = manager.create(HealthProfile, {
      patient: { id: saved.id },
    });
    await manager.save(HealthProfile, newHealthProfile);

    return saved;
  }

  private async findOwnedByUserIdTransaction(
    manager: EntityManager,
    userId: number,
    relativeId: number,
  ) {
    const relative = await manager.findOne(Relative, {
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
