import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Role from 'src/entities/role.entity';
import User from 'src/entities/user.entity';
import UserRole from 'src/entities/userRole.entity';
import { ROLE_NAME } from 'src/utils/constants';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { UsersMapper } from './users.mapper';
import { BodyFilterUsersDto } from './dto/request/bodyFilterUsers.dto';
import { UserResponseDto } from './dto/response/userResponse.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
      return UsersMapper.toUserProfileResponse(newUser);
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
    let { page, limit, arrange, search, role_id } = objectFilters;
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

    return new PaginationResultDto<UserResponseDto>(
      'users',
      UsersMapper.toUserListResponse(users),
      total,
      page,
      limit,
    );
  }

  async isUserExists(userId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return !!user;
  }

  async isUserExistsByUsername(username: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { username } });
    return !!user;
  }

  async isUserExistsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    return !!user;
  }
}
