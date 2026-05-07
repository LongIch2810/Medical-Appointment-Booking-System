import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Role from 'src/entities/role.entity';
import { DataSource, Like, QueryFailedError, Repository } from 'typeorm';
import { BodyCreateRoleDto } from './dto/request/bodyCreateRole.dto';
import { BodyFilterRolesDto } from './dto/request/bodyFilterRoles.dto';
import { RolesMapper } from './roles.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { PermissionsService } from '../permissions/permissions.service';
import RolePermission from 'src/entities/rolePermission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    private datasource: DataSource
  ) { }

  async create(body: BodyCreateRoleDto) {
    try {
      return await this.datasource.transaction(async (manager) => {
        const { role_name, role_code, description, permission_ids } = body;
        const isExistsRoleByName = await this.isRoleNameExist(role_name);
        const isExistsRoleByCode = await this.isRoleCodeExist(role_code);
        if (isExistsRoleByName || isExistsRoleByCode) {
          throw new ConflictException('Vai trò đã tồn tại');
        }
        const uniquePermissionIds = [...new Set(permission_ids)];
        const isPermissionListExist = await this.permissionsService.isPermissionListExist(uniquePermissionIds);
        if (!isPermissionListExist) {
          throw new NotFoundException('Danh sách quyền có quyền không tồn tại trong hệ thống');
        }
        const createdRole = manager.create(Role, {
          role_name,
          role_code,
          description,
        });
        const newRole = await manager.save(Role, createdRole);
        await manager.save(RolePermission, uniquePermissionIds.map((permission_id) => ({
          role: { id: newRole.id },
          permission: { id: permission_id }
        })))
        const roleDetail = await this.getRoleDetail(newRole.id);
        return roleDetail;
      })
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
    const [roles, total] = await this.roleRepo.findAndCount({
      relations: ['permissions', 'permissions.permission'],
      skip,
      take: limit,
      order: {
        role_name: arrange.toUpperCase() as 'ASC' | 'DESC',
      },
      where: {
        role_name: Like(`%${search}%`),
        description: Like(`%${search}%`),
      },
    });
    const result = new PaginationResultDto("roles",
      RolesMapper.toRoleResponseDtoList(roles),
      total, page, limit)
    return result;
  }

  async getRoleDetail(id: number) {
    const role = await this.findById(id);
    return RolesMapper.toRoleResponseDto(role);
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
