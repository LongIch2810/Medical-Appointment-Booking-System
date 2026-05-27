import type { DoctorLevel, PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";

export interface RolePermissionSummary {
  id: number;
  name: string;
}

export interface RoleSummary {
  id?: number;
  role_name: string;
  description?: string | null;
  permissions?: RolePermissionSummary[];
}

export interface User {
  id: number;
  fullname: string;
  email: string;
  picture: string | null;
  date_of_birth: string | null;
  gender: boolean;
  address: string | null;
  phone: string | null;
  username: string;
  isAdmin: boolean;
  is_active?: boolean;
  is_locked?: boolean;
  is_locking?: boolean;
  roles: RoleSummary[];
  permissions?: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface UserListPayload extends PaginationPayload {
  search?: string;
  role_id?: number;
  arrange?: SortOrder;
}

export interface UserListResponse extends PaginationMeta {
  users: User[];
}

export interface PatientListResponse extends PaginationMeta {
  patients: User[];
}

export interface UpdateUserRolesPayload {
  role_ids: number[];
}

export interface UpdateUserFieldsPayload {
  fullname?: string;
  phone?: string;
  gender?: boolean;
  date_of_birth?: string | Date;
  picture?: string;
  address?: string;
}

export interface CreateUserDoctorPayload {
  specialty_id: number;
  experience: number;
  about_me: string;
  workplace: string;
  doctor_level: DoctorLevel | string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  fullname: string;
  phone?: string;
  gender?: boolean;
  date_of_birth?: string;
  address?: string;
  picture?: string;
  is_active?: boolean;
  is_locking?: boolean;
  role_ids: number[];
  doctor?: CreateUserDoctorPayload;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}
