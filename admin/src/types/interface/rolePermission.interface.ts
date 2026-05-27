export interface RolePermissionMatrixRoleDto {
  id: number;
  role_name: string;
  description: string | null;
  role_code: string | null;
  permission_ids: number[];
}

export interface RolePermissionMatrixPermissionDto {
  id: number;
  name: string;
}

export interface RolePermissionMatrixResponseDto {
  roles: RolePermissionMatrixRoleDto[];
  permissions: RolePermissionMatrixPermissionDto[];
}

// Backwards compatible aliases used by existing api/hooks code.
export type RolePermissionMatrixRole = RolePermissionMatrixRoleDto;
export type RolePermissionMatrixPermission = RolePermissionMatrixPermissionDto;
export type RolePermissionMatrix = RolePermissionMatrixResponseDto;
