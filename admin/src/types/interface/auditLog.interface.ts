import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface AuditLogUserDto {
  id: number;
  fullname: string;
  email: string;
  picture: string;
}

export interface AuditLogResponseDto {
  id: number;
  action: string;
  entity_name: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  endpoint: string;
  method: string;
  status_code: number;
  is_success: boolean;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  duration_ms: number;
  user: AuditLogUserDto | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogListResponseDto extends PaginationMeta {
  auditLogs: AuditLogResponseDto[];
}

export interface AuditLogListPayload extends PaginationPayload {
  search?: string;
  action?: string;
  entityName?: string;
  userId?: number;
  method?: string;
  isSuccess?: boolean;
  fromDate?: string;
  toDate?: string;
  arrange?: SortOrder;
}

// Backwards compatible aliases used by existing api/hooks code.
export type AuditLogUser = AuditLogUserDto;
export type AuditLog = AuditLogResponseDto;
export type AuditLogListResponse = AuditLogListResponseDto;
