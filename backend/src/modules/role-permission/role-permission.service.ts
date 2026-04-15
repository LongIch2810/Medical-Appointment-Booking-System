import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import Role from 'src/entities/role.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { In, Repository } from 'typeorm';
import { BodyAssignRolePermissionsDto } from './dto/bodyAssignRolePermissions.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private redisCacheService: RedisCacheService,
  ) {}

  async getPermissionsByRoles(
    userId: number,
    roles: string[],
  ): Promise<string[]> {
    const cacheKey = `permissions:${userId}`;
    const cachedData = (await this.redisCacheService.getData(
      cacheKey,
    )) as string[];
    if (cachedData) return cachedData;

    const rawPermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'permission')
      .innerJoin('rp.role', 'role')
      .where('role.role_name IN (:...roles)', { roles })
      .select('DISTINCT permission.name', 'name')
      .getRawMany();

    const permissions = rawPermissions.map((item) => item.name);

    await this.redisCacheService.setData(cacheKey, permissions, 3600);

    return permissions;
  }

  async getRolePermissions(roleId: number) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Vai trò không tồn tại');
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });

    return {
      role,
      permissions: rolePermissions.map(
        (rolePermission) => rolePermission.permission,
      ),
    };
  }

  async assignPermissions(
    roleId: number,
    bodyAssignRolePermissions: BodyAssignRolePermissionsDto,
  ) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Vai trò không tồn tại');
    }

    const requestedPermissionIds = await this.resolvePermissionIds(
      bodyAssignRolePermissions,
    );
    if (!requestedPermissionIds.length) {
      throw new BadRequestException('Danh sách permission không hợp lệ');
    }

    const existingMappings = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
      withDeleted: true,
    });

    const existingByPermissionId = new Map(
      existingMappings.map((mapping) => [mapping.permission.id, mapping]),
    );

    for (const permissionId of requestedPermissionIds) {
      const existingMapping = existingByPermissionId.get(permissionId);
      if (!existingMapping) {
        await this.rolePermissionRepository.save(
          this.rolePermissionRepository.create({
            role: { id: roleId },
            permission: { id: permissionId },
          }),
        );
        continue;
      }

      if (existingMapping.deleted_at) {
        await this.rolePermissionRepository.restore(existingMapping.id);
      }
    }

    const requestedPermissionIdSet = new Set(requestedPermissionIds);
    const toDisable = existingMappings.filter(
      (mapping) =>
        !mapping.deleted_at && !requestedPermissionIdSet.has(mapping.permission.id),
    );

    if (toDisable.length) {
      await this.rolePermissionRepository.softDelete(
        toDisable.map((mapping) => mapping.id),
      );
    }

    return this.getRolePermissions(roleId);
  }

  private async resolvePermissionIds(
    bodyAssignRolePermissions: BodyAssignRolePermissionsDto,
  ) {
    if (bodyAssignRolePermissions.permission_ids?.length) {
      const permissions = await this.permissionRepo.find({
        where: {
          id: In(bodyAssignRolePermissions.permission_ids),
        },
      });

      if (
        permissions.length !== bodyAssignRolePermissions.permission_ids.length
      ) {
        throw new NotFoundException('Một hoặc nhiều permission không tồn tại');
      }

      return permissions.map((permission) => permission.id);
    }

    if (bodyAssignRolePermissions.permission_names?.length) {
      const permissions = await this.permissionRepo.find({
        where: {
          name: In(bodyAssignRolePermissions.permission_names),
        },
      });

      if (
        permissions.length !== bodyAssignRolePermissions.permission_names.length
      ) {
        throw new NotFoundException('Một hoặc nhiều permission không tồn tại');
      }

      return permissions.map((permission) => permission.id);
    }

    return [];
  }
}
