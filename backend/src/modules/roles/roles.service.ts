import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Role from 'src/entities/role.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { BodyCreateRoleDto } from './dto/request/bodyCreateRole.dto';
import { BodyFilterRolesDto } from './dto/request/bodyFilterRoles.dto';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private roleRepo: Repository<Role>) {}

  async create(body: BodyCreateRoleDto) {
    try {
      const { role_name, role_code, description } = body;
      const isExistsRoleByName = await this.isRoleNameExist(role_name);
      const isExistsRoleByCode = await this.isRoleCodeExist(role_code);
      if (isExistsRoleByName || isExistsRoleByCode) {
        throw new ConflictException('Vai trò đã tồn tại');
      }
      const role = this.roleRepo.create({
        role_name,
        role_code,
        description,
      });
      await this.roleRepo.save(role);
      return {
        message: 'Tạo vai trò thành công',
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Vai trò đã tồn tại');
      }
      throw error;
    }
  }

  async update(roleId: number, body: Partial<BodyCreateRoleDto>) {
    const role = await this.findById(roleId);
    const nextRoleName = body.role_name?.trim();
    const nextDescription = body.description?.trim();
    const nextRoleCode =
      body.role_code !== undefined ? Number(body.role_code) : undefined;

    if (nextRoleName && nextRoleName !== role.role_name) {
      const isExistsRoleByName = await this.roleRepo
        .createQueryBuilder('role')
        .where('LOWER(role.role_name) = LOWER(:role_name)', {
          role_name: nextRoleName,
        })
        .andWhere('role.id != :roleId', { roleId })
        .getOne();

      if (isExistsRoleByName) {
        throw new ConflictException('Vai trò đã tồn tại');
      }
      role.role_name = nextRoleName;
    }

    if (nextRoleCode !== undefined && nextRoleCode !== role.role_code) {
      const isExistsRoleByCode = await this.roleRepo
        .createQueryBuilder('role')
        .where('role.role_code = :role_code', {
          role_code: nextRoleCode,
        })
        .andWhere('role.id != :roleId', { roleId })
        .getOne();

      if (isExistsRoleByCode) {
        throw new ConflictException('Vai trò đã tồn tại');
      }
      role.role_code = nextRoleCode;
    }

    if (nextDescription) {
      role.description = nextDescription;
    }

    await this.roleRepo.save(role);
    return {
      message: 'Cập nhật vai trò thành công',
      role,
    };
  }

  async filterAndPagination(objectFilters: BodyFilterRolesDto) {
    let { page, limit, search, arrange } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;
    const query = this.roleRepo
      .createQueryBuilder('role')
      .orderBy('role.role_name', arrange.toUpperCase() as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit);
    if (search) {
      query.where('role.role_name ILIKE :search', { search: `%${search}%` });
      query.orWhere('role.role_code ILIKE :search', { search: `%${search}%` });
      query.orWhere('role.description ILIKE :search', {
        search: `%${search}%`,
      });
    }
    const [roles, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      roles,
      total,
      page,
      totalPages,
      limit,
    };
  }

  async isRoleNameExist(role_name: string) {
    const role = await this.roleRepo.findOne({ where: { role_name } });
    return !!role;
  }

  async isRoleCodeExist(role_code: number) {
    const role = await this.roleRepo.findOne({ where: { role_code } });
    return !!role;
  }

  async findById(roleId: number) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.permission'],
    });
    if (!role) {
      throw new NotFoundException('Vai trò không tồn tại');
    }
    return role;
  }
}
