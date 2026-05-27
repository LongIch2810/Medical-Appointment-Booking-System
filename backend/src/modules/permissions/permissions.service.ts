import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import { In, Like, Repository } from 'typeorm';
import { BodyFilterPermissionsDto } from './dto/request/bodyFilterPermissions.dto';
import { PaginationResultDto } from 'src/common/dto/paginationResult.dto';
import { PermissionsMapper } from './permissions.mapper';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async filterAndPagination(objectFilters: BodyFilterPermissionsDto) {
    let { page, limit, search, arrange, role_id } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;
    const keyword = search?.trim() ?? '';
    const roleIdCondition = role_id ? { roles: { role: { id: role_id } } } : {};
    const where = keyword
      ? [
          { name: Like(`%${keyword}%`) },
          { description: Like(`%${keyword}%`) },
          roleIdCondition,
        ]
      : [roleIdCondition];
    const [permissions, total] = await this.permissionRepo.findAndCount({
      skip,
      take: limit,
      order: {
        name: arrange.toUpperCase() as 'ASC' | 'DESC',
      },
      where,
    });
    const result = new PaginationResultDto(
      'permissions',
      PermissionsMapper.toPermissionResponseDtoList(permissions),
      total,
      page,
      limit,
    );
    return result;
  }

  async getPermissionDetail(id: number) {
    const permission = await this.findPermissionById(id);
    return PermissionsMapper.toPermissionResponseDto(permission);
  }

  async checkPermissionExist(roleId: number, permissionName: string) {
    const permission = await this.permissionRepo.findOne({
      where: {
        roles: { role: { id: roleId } },
        name: permissionName,
      },
    });
    return !!permission;
  }

  async findPermissionById(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: {
        id,
      },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} not found`);
    }
    return permission;
  }

  async isPermissionListExist(permissionIds: number[]) {
    const permissions = await this.permissionRepo.find({
      where: {
        id: In(permissionIds),
      },
    });
    return permissions.length === permissionIds.length;
  }
}
