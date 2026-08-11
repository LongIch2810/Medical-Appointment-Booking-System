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
import { RolePermissionMatrixResponseDto } from './dto/response/rolePermissionMatrixResponse.dto';
import { RolePermissionMapper } from './role-permission.mapper';

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

  async getMatrix(): Promise<RolePermissionMatrixResponseDto> {
    const [roles, permissions] = await Promise.all([
      this.roleRepo.find({
        relations: ['permissions', 'permissions.permission'],
        order: { role_name: 'ASC' },
      }),
      this.permissionRepo.find({ order: { name: 'ASC' } }),
    ]);

    return RolePermissionMapper.toMatrixResponseDto({
      roles: roles.map((role) => ({
        id: role.id,
        role_name: role.role_name,
        description: role.description,
        role_code: role.role_code,
        permission_ids: role.permissions
          ?.filter((rolePermission) => !rolePermission.deleted_at)
          .map((rolePermission) => rolePermission.permission.id),
      })),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
      })),
    });
  }
}
