import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Role {
  id: number;
  role_name: string;
  description?: string | null;
  permissions?: PermissionSummary[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PermissionSummary {
  id: number;
  permission_code: string;
  description?: string | null;
}

export interface RoleListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface RoleListResponse extends PaginationMeta {
  roles: Role[];
}

export interface CreateRolePayload {
  role_name: string;
  role_code: number;
  description: string;
  permission_ids: number[];
}

export interface UpdateRolePayload {
  role_name?: string;
  description?: string;
}

export interface UpdateRolePermissionsPayload {
  permission_ids: number[];
}

export type DeleteRolePermissionsPayload = UpdateRolePermissionsPayload;
