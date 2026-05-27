import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class RolePermissionMatrixRoleDto {
  @Expose()
  id!: number;

  @Expose()
  role_name!: string;

  @Expose()
  description!: string | null;

  @Expose()
  role_code!: string | null;

  @Expose()
  permission_ids!: number[];
}

@Exclude()
export class RolePermissionMatrixPermissionDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

@Exclude()
export class RolePermissionMatrixResponseDto {
  @Expose()
  @Type(() => RolePermissionMatrixRoleDto)
  roles!: RolePermissionMatrixRoleDto[];

  @Expose()
  @Type(() => RolePermissionMatrixPermissionDto)
  permissions!: RolePermissionMatrixPermissionDto[];
}
