import {
  BadRequestException,
  ConflictException,
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
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  ILike,
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
      if (isExistsUserByUsername || isExistsUserByEmail) {
        throw new ConflictException('Người dùng đã tồn tại');
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
        throw new ConflictException('Người dùng đã tồn tại');
      }
      throw error;
    }
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

  async filterAndPagination(objectFilters: BodyFilterUsersDto) {
    let { page, limit } = objectFilters;
    const { search, role_id, arrange } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] | undefined;
    const roleCondition = role_id ? { roles: { role: { id: role_id } } } : {};
    const searchFields: (keyof User)[] = ['username', 'email', 'fullname'];
    if (search) {
      where = searchFields.map((field) => ({
        [field]: ILike(`%${search}%`),
        ...roleCondition,
      }));
    } else if (role_id) {
      where = roleCondition;
    }
    const [users, total] = await this.userRepo.findAndCount({
      where,
      relations: {
        roles: { role: true },
      },
      order: { created_at: arrange.toUpperCase() as 'ASC' | 'DESC' },
      skip,
      take: limit,
    });
    const result = new PaginationResultDto<UserResponseDto>(
      'users',
      UsersMapper.toUserListResponse(users),
      total,
      page,
      limit,
    );

    return result;
  }

  async filterAndPaginationPatients(objectFilters: BodyFilterUsersDto) {
    let { page, limit } = objectFilters;
    const { search, arrange } = objectFilters;
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;
    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] | undefined;
    const roleCondition = { roles: { role: { role_name: ROLE_NAME.PATIENT } } };
    where = roleCondition;
    const searchFields: (keyof User)[] = ['username', 'email', 'fullname'];
    if (search) {
      where = searchFields.map((field) => ({
        [field]: ILike(`%${search}%`),
        ...roleCondition,
      }));
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      relations: {
        roles: { role: true },
      },
      order: { created_at: arrange.toUpperCase() as 'ASC' | 'DESC' },
      skip,
      take: limit,
    });
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
    user.is_locking = isLocking;
    const updatedUser = await this.userRepo.save(user);
    return UsersMapper.toUserProfileResponse(updatedUser);
  }

  async setActive(userId: number, isActive: boolean) {
    const user = await this.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    user.is_active = isActive;
    const updatedUser = await this.userRepo.save(user);
    return UsersMapper.toUserProfileResponse(updatedUser);
  }

  async updateRoles(userId: number, roleIds: number[]) {
    return this.dataSource.transaction(async (manager) => {
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

      await this.redisCacheService.delData(`permissions:${userId}`);

      return UsersMapper.toUserProfileResponse(updatedUser!);
    });
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
