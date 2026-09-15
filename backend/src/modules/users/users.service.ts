import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import Doctor from 'src/entities/doctor.entity';
import HealthProfile from 'src/entities/healthProfile.entity';
import Relationship from 'src/entities/relationship.entity';
import Relative from 'src/entities/relative.entity';
import Role from 'src/entities/role.entity';
import Specialty from 'src/entities/specialty.entity';
import User from 'src/entities/user.entity';
import UserRole from 'src/entities/userRole.entity';
import { ROLE_NAME } from 'src/utils/constants';
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { UsersMapper } from './users.mapper';
import { BodyCreateUserDto } from './dto/request/bodyCreateUser.dto';
import { BodyFilterUsersDto } from './dto/request/bodyFilterUsers.dto';
import { UserResponseDto } from './dto/response/userResponse.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      relations: ['roles', 'roles.role'],
    });

    return user;
  }

  async findByUserId(userId: number): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        roles: {
          role: {
            permissions: {
              permission: true,
            },
          },
        },
      },
    });

    return user;
  }

  async getUserProfile(userId: number) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return UsersMapper.toUserProfileResponse(user);
  }

  async createUser(
    manager: EntityManager,
    username: string,
    email: string,
    fullname: string,
    password: string | null,
  ) {
    try {
      const isExistsUserByUsername =
        await this.isUserExistsByUsername(username);
      const isExistsUserByEmail = await this.isUserExistsByEmail(email);
      if (isExistsUserByEmail) {
        throw new ConflictException(
          'Email đã được sử dụng. Nếu tài khoản được tạo bằng Google, vui lòng đăng nhập bằng Google.',
        );
      }
      if (isExistsUserByUsername) {
        throw new ConflictException('Tên đăng nhập đã được sử dụng.');
      }
      const createdData = password
        ? {
            username,
            email,
            fullname,
            password,
          }
        : { username, email, fullname };
      const createdUser = manager.create(User, createdData);
      const newUser = await manager.save(User, createdUser);
      const role = await manager.findOne(Role, {
        where: { role_name: ROLE_NAME.PATIENT },
      });
      if (!role) {
        throw new NotFoundException('Role Patient mặc định không tồn tại!');
      }
      await manager.save(UserRole, {
        user: newUser,
        role,
      });
      return newUser;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Tên đăng nhập hoặc email đã được sử dụng.',
        );
      }
      throw error;
    }
  }

  /**
   * Tạo user + role PATIENT (qua createUser) kèm hồ sơ mặc định đi cùng: một
   * Relative "bản thân" (relationship_code = ban_than) và HealthProfile rỗng.
   * Đây là luồng đăng ký user mới dùng chung cho cả đăng ký local
   * (AuthService.register) lẫn đăng ký qua Google (GoogleStrategy), để hai nơi
   * không tự triển khai lại và lệch nhau theo thời gian.
   */
  async createUserWithDefaultProfile(
    manager: EntityManager,
    username: string,
    email: string,
    fullname: string,
    password: string | null,
  ): Promise<User> {
    const newUser = await this.createUser(
      manager,
      username,
      email,
      fullname,
      password,
    );

    const relationship = await manager.findOne(Relationship, {
      where: { relationship_code: 'ban_than' },
    });
    if (!relationship) {
      throw new NotFoundException('Mối quan hệ mặc định không tồn tại.');
    }

    const newRelative = manager.create(Relative, {
      user: newUser,
      fullname,
      relationship,
    });
    await manager.save(Relative, newRelative);

    const newHealth = manager.create(HealthProfile, {
      patient: newRelative,
    });
    await manager.save(HealthProfile, newHealth);

    return newUser;
  }

  async adminCreateUser(dto: BodyCreateUserDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const existingUsername = await manager.findOne(User, {
          where: { username: dto.username },
        });
        if (existingUsername) {
          throw new ConflictException('Username đã tồn tại');
        }

        const existingEmail = await manager.findOne(User, {
          where: { email: dto.email },
        });
        if (existingEmail) {
          throw new ConflictException('Email đã tồn tại');
        }

        if (dto.phone) {
          const existingPhone = await manager.findOne(User, {
            where: { phone: dto.phone },
          });
          if (existingPhone) {
            throw new ConflictException('Số điện thoại đã tồn tại');
          }
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const createdUser = manager.create(User, {
          username: dto.username,
          email: dto.email,
          password: hashedPassword,
          fullname: dto.fullname,
          phone: dto.phone ?? null,
          gender: dto.gender ?? true,
          date_of_birth: dto.date_of_birth ?? null,
          address: dto.address ?? null,
          picture: dto.picture ?? null,
          is_active: dto.is_active ?? true,
          is_locking: dto.is_locking ?? false,
        });
        const newUser = await manager.save(User, createdUser);

        const uniqueRoleIds = [...new Set(dto.role_ids)];
        const roles = await manager.find(Role, {
          where: { id: In(uniqueRoleIds) },
        });
        if (roles.length !== uniqueRoleIds.length) {
          throw new NotFoundException('Một hoặc nhiều vai trò không tồn tại');
        }

        await manager.save(
          UserRole,
          roles.map((role) => ({ user: newUser, role })),
        );

        const doctorRole = roles.find((r) => r.role_name === ROLE_NAME.DOCTOR);
        if (doctorRole) {
          if (!dto.doctor) {
            throw new BadRequestException('Vui lòng nhập thông tin bác sĩ');
          }

          const specialty = await manager.findOne(Specialty, {
            where: { id: dto.doctor.specialty_id },
          });
          if (!specialty) {
            throw new NotFoundException('Chuyên khoa không tồn tại');
          }

          const existedDoctor = await manager.findOne(Doctor, {
            where: { user: { id: newUser.id } },
          });
          if (!existedDoctor) {
            const newDoctor = manager.create(Doctor, {
              experience: dto.doctor.experience,
              about_me: dto.doctor.about_me,
              workplace: dto.doctor.workplace,
              doctor_level: dto.doctor.doctor_level,
              user: newUser,
              specialty,
            });
            await manager.save(Doctor, newDoctor);
          }
        }

        const patientRole = roles.find(
          (r) => r.role_name === ROLE_NAME.PATIENT,
        );
        if (patientRole) {
          const relationship = await manager.findOne(Relationship, {
            where: { relationship_code: 'ban_than' },
          });
          if (!relationship) {
            throw new NotFoundException('Mối quan hệ mặc định không tồn tại');
          }

          const newRelative = manager.create(Relative, {
            user: newUser,
            fullname: dto.fullname,
            relationship,
          });
          await manager.save(Relative, newRelative);

          const newHealth = manager.create(HealthProfile, {
            patient: newRelative,
          });
          await manager.save(HealthProfile, newHealth);
        }

        const savedUser = await manager.findOne(User, {
          where: { id: newUser.id },
          relations: {
            roles: {
              role: {
                permissions: {
                  permission: true,
                },
              },
            },
          },
        });
        return UsersMapper.toUserProfileResponse(savedUser!);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Người dùng đã tồn tại');
      }
      throw error;
    }
  }

  async updateUserField(
    userId: number,
    updateFieldName: string,
    updateFieldValue: any,
  ) {
    return this.userRepo.update(userId, {
      [updateFieldName]: updateFieldValue,
    });
  }

  async updateUserFields(userId: number, updateFields: Partial<User>) {
    return this.userRepo.update(userId, updateFields);
  }

  async updateAdminUser(
    userId: number,
    updateFields: Partial<
      Pick<User, 'fullname' | 'phone' | 'gender' | 'date_of_birth' | 'address'>
    >,
  ) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const { fullname, phone, gender, date_of_birth, address } = updateFields;
    const editableFields = {
      fullname,
      phone,
      gender,
      date_of_birth,
      address,
    };

    Object.assign(
      user,
      Object.fromEntries(
        Object.entries(editableFields).filter(
          ([, value]) => value !== undefined,
        ),
      ),
    );

    const updatedUser = await this.userRepo.save(user);
    return UsersMapper.toUserProfileResponse(updatedUser);
  }

  async filterAndPagination(objectFilters: BodyFilterUsersDto) {
    let { page, limit } = objectFilters;
    const { search, role_id, arrange } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;

    const query = this.userRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where(
        `NOT EXISTS (
          SELECT 1
          FROM user_roles patientUserRole
          INNER JOIN roles patientRole ON patientRole.id = patientUserRole.role_id
          WHERE patientUserRole.user_id = account.id
            AND patientUserRole.deleted_at IS NULL
            AND patientRole.deleted_at IS NULL
            AND patientRole.role_name = :patientRole
        )`,
        { patientRole: ROLE_NAME.PATIENT },
      );

    if (search) {
      query.andWhere(
        '(account.username ILIKE :search OR account.email ILIKE :search OR account.fullname ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role_id) {
      query
        .innerJoin('account.roles', 'filterUserRole')
        .andWhere('filterUserRole.role_id = :roleId', { roleId: role_id });
    }

    const [users, total] = await query
      .orderBy('account.created_at', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const result = new PaginationResultDto<UserResponseDto>(
      'users',
      UsersMapper.toUserListResponse(users),
      total,
      page,
      limit,
    );

    return result;
  }

  async filterAndPaginationPatients(
    objectFilters: BodyFilterUsersDto,
    actorUserId: number,
    actorRoles: string[],
  ) {
    let { page, limit } = objectFilters;
    const { search, arrange } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;

    const isAdmin = actorRoles.includes(ROLE_NAME.ADMIN);
    const isDoctor = actorRoles.includes(ROLE_NAME.DOCTOR);
    if (!isAdmin && !isDoctor) {
      throw new ForbiddenException(
        'Bạn không có quyền xem danh sách bệnh nhân.',
      );
    }

    const query = this.userRepo
      .createQueryBuilder('patientUser')
      .leftJoinAndSelect('patientUser.roles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('role.role_name = :patientRole', {
        patientRole: ROLE_NAME.PATIENT,
      });

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('patientUser.username ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('patientUser.email ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('patientUser.fullname ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    if (!isAdmin) {
      // Bác sĩ chỉ được xem những bệnh nhân đã từng có lịch hẹn với chính
      // mình — tránh lộ thông tin liên hệ (SĐT, địa chỉ, ngày sinh...) của
      // toàn bộ bệnh nhân trong hệ thống cho mọi tài khoản bác sĩ.
      // Alias "patientUser" (not "user") — "user" is a reserved word in
      // Postgres, so bare "user.id" inside this raw subquery parses as the
      // CURRENT_USER special token and breaks with a syntax error.
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM appointments appt
          INNER JOIN relatives rel ON rel.id = appt.patient_id
          INNER JOIN doctor_schedules ds ON ds.id = appt.doctor_schedule_id
          INNER JOIN doctors doc ON doc.id = ds.doctor_id
          WHERE rel.user_id = "patientUser".id
            AND doc.user_id = :actorUserId
            AND appt.deleted_at IS NULL
        )`,
        { actorUserId },
      );
    }

    query
      .orderBy(
        'patientUser.created_at',
        arrange.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip(skip)
      .take(limit);

    const [users, total] = await query.getManyAndCount();
    const result = new PaginationResultDto<UserResponseDto>(
      'users',
      UsersMapper.toUserListResponse(users),
      total,
      page,
      limit,
    );

    return result;
  }

  async isUserExists(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return !!user;
  }

  async getAdminUserDetail(userId: number) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return UsersMapper.toUserProfileResponse(user);
  }

  async setLocking(userId: number, isLocking: boolean) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (isLocking && this.hasAdminRole(user)) {
      throw new ForbiddenException('Không thể khóa tài khoản có vai trò ADMIN');
    }
    user.is_locking = isLocking;
    const updatedUser = await this.userRepo.save(user);
    return UsersMapper.toUserProfileResponse(updatedUser);
  }

  async setActive(userId: number, isActive: boolean) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (!isActive && this.hasAdminRole(user)) {
      throw new ForbiddenException(
        'Không thể vô hiệu hóa tài khoản có vai trò ADMIN',
      );
    }
    user.is_active = isActive;
    const updatedUser = await this.userRepo.save(user);
    return UsersMapper.toUserProfileResponse(updatedUser);
  }

  private hasAdminRole(user: User): boolean {
    return user.roles.some(
      (userRole) => userRole.role.role_name === ROLE_NAME.ADMIN,
    );
  }

  async updateRoles(userId: number, roleIds: number[]) {
    const result = await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const uniqueRoleIds = [...new Set(roleIds)];
      if (!uniqueRoleIds.length) {
        throw new NotFoundException('Danh sách vai trò không hợp lệ');
      }

      const roles = await manager.find(Role, {
        where: { id: In(uniqueRoleIds) },
      });
      if (roles.length !== uniqueRoleIds.length) {
        throw new NotFoundException(
          'Danh sách vai trò có vai trò không tồn tại',
        );
      }

      await manager.delete(UserRole, { user: { id: userId } });
      await manager.save(
        UserRole,
        roles.map((role) => ({ user: { id: userId }, role })),
      );

      const updatedUser = await manager.findOne(User, {
        where: { id: userId },
        relations: {
          roles: {
            role: {
              permissions: {
                permission: true,
              },
            },
          },
        },
      });

      return UsersMapper.toUserProfileResponse(updatedUser!);
    });

    await this.redisCacheService.delData(`permissions:${userId}`);

    return result;
  }

  async isUserExistsByUsername(username: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { username } });
    return !!user;
  }

  async isUserExistsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    return !!user;
  }

  async numberOfUsersByAllRoles() {
    const count = await this.userRepo.count({});
    return count;
  }

  async numberOfUsersByRolePatientActive() {
    const count = await this.userRepo.count({
      where: {
        roles: {
          role: {
            role_name: ROLE_NAME.PATIENT,
          },
        },
        is_active: true,
      },
    });
    return count;
  }

  async numberOfUsersByRoleDoctorActive() {
    const count = await this.userRepo.count({
      where: {
        roles: {
          role: {
            role_name: ROLE_NAME.DOCTOR,
          },
        },
        is_active: true,
      },
    });
    return count;
  }
}
