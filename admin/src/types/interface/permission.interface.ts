import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface Permission {
  id: number;
  permission_code: string;
  description?: string | null;
}

export interface PermissionListPayload extends PaginationPayload {
  search?: string;
  arrange?: SortOrder;
}

export interface PermissionListResponse extends PaginationMeta {
  permissions: Permission[];
}
