import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Role from 'src/entities/role.entity';
import { DataSource, In, Like, QueryFailedError, Repository } from 'typeorm';
import { BodyCreateRoleDto } from './dto/request/bodyCreateRole.dto';
import { BodyFilterRolesDto } from './dto/request/bodyFilterRoles.dto';
import { RolesMapper } from './roles.mapper';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { PermissionsService } from '../permissions/permissions.service';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    private datasource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}

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
        const isPermissionListExist =
          await this.permissionsService.isPermissionListExist(
            uniquePermissionIds,
          );
        if (!isPermissionListExist) {
          throw new NotFoundException(
            'Danh sách quyền có quyền không tồn tại trong hệ thống',
          );
        }
        const createdRole = manager.create(Role, {
          role_name,
          role_code,
          description,
        });
        const newRole = await manager.save(Role, createdRole);
        await manager.save(
          RolePermission,
          uniquePermissionIds.map((permission_id) => ({
            role: { id: newRole.id },
            permission: { id: permission_id },
          })),
        );
        const roleDetail = await manager.findOne(Role, {
          where: { id: newRole.id },
          relations: ['permissions', 'permissions.permission'],
        });
        return RolesMapper.toRoleResponseDto(roleDetail!);
      });
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
    return await this.datasource.transaction(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id: roleId },
        relations: ['permissions', 'permissions.permission'],
      });
      if (!role) {
        throw new NotFoundException('Vai trò không tồn tại');
      }
      const nextRoleName = body.role_name;
      const nextDescription = body.description;
      const nextRoleCode =
        body.role_code !== undefined ? Number(body.role_code) : undefined;

      if (nextRoleName && nextRoleName !== role.role_name) {
        const isExistsRoleByName = await manager
          .getRepository(Role)
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
        const isExistsRoleByCode = await manager
          .getRepository(Role)
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

      await manager.save(role);
      return RolesMapper.toRoleResponseDto(role);
    });
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    const result = await this.datasource.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId } });
      if (!role) {
        throw new NotFoundException('Vai trò không tồn tại');
      }
      const uniquePermissionIds = [...new Set(permissionIds)];
      if (!uniquePermissionIds.length) {
        throw new NotFoundException('Danh sách quyền không hợp lệ');
      }
      const isPermissionListExist =
        await this.permissionsService.isPermissionListExist(
          uniquePermissionIds,
        );
      if (!isPermissionListExist) {
        throw new NotFoundException(
          'Danh sách quyền có quyền không tồn tại trong hệ thống',
        );
      }
      const rolePermissionRepo = manager.getRepository(RolePermission);
      const existingRolePermissions = await rolePermissionRepo.find({
        where: {
          role: { id: roleId },
          permission: { id: In(uniquePermissionIds) },
        },
        relations: ['permission'],
        withDeleted: true,
      });
      const existingPermissionIds = new Set(
        existingRolePermissions.map(
          (rolePermission) => rolePermission.permission.id,
        ),
      );
      const deletedRolePermissions = existingRolePermissions.filter(
        (rolePermission) => rolePermission.deleted_at,
      );
      if (deletedRolePermissions.length) {
        await rolePermissionRepo.restore(
          deletedRolePermissions.map((rolePermission) => rolePermission.id),
        );
      }
      const newRolePermissions = uniquePermissionIds
        .filter((permissionId) => !existingPermissionIds.has(permissionId))
        .map((permissionId) =>
          rolePermissionRepo.create({
            role: { id: roleId },
            permission: { id: permissionId },
          }),
        );
      if (newRolePermissions.length) {
        await rolePermissionRepo.save(newRolePermissions);
      }
      return this.getRoleDetail(roleId);
    });
    await this.redisCacheService.delByPrefix('permissions:');
    return result;
  }
  async deleteRolePermissions(roleId: number, permissionIds: number[]) {
    const result = await this.datasource.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId } });
      if (!role) {
        throw new NotFoundException('Vai trò không tồn tại');
      }
      const uniquePermissionIds = [...new Set(permissionIds)];
      if (!uniquePermissionIds.length) {
        throw new NotFoundException('Danh sách quyền không hợp lệ');
      }
      const rolePermissionRepo = manager.getRepository(RolePermission);
      const rolePermissions = await rolePermissionRepo.find({
        where: {
          role: { id: roleId },
          permission: { id: In(uniquePermissionIds) },
        },
        relations: ['permission'],
      });
      if (rolePermissions.length !== uniquePermissionIds.length) {
        throw new NotFoundException(
          'Một hoặc nhiều quyền không thuộc vai trò này',
        );
      }
      await rolePermissionRepo.softDelete(
        rolePermissions.map((rolePermission) => rolePermission.id),
      );
      return this.getRoleDetail(roleId);
    });
    await this.redisCacheService.delByPrefix('permissions:');
    return result;
  }

  async filterAndPagination(objectFilters: BodyFilterRolesDto) {
    let { page, limit } = objectFilters;
    const { search, arrange } = objectFilters;
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
    const result = new PaginationResultDto(
      'roles',
      RolesMapper.toRoleResponseDtoList(roles),
      total,
      page,
      limit,
    );
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
