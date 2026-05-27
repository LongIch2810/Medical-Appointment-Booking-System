import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateRolePayload,
  Role,
  RoleListPayload,
  RoleListResponse,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from "@/types/interface/role.interface";

export const fetchRoles = async (data: RoleListPayload) => {
  const res = await axiosInstance.post<ApiResponse<RoleListResponse>>(
    "/roles",
    data,
  );
  return res.data;
};

export const createRole = async (data: CreateRolePayload) => {
  const res = await axiosInstance.post<ApiResponse<Role>>(
    "/roles/create-role",
    data,
  );
  return res.data;
};

export const fetchRoleDetail = async (roleId: number) => {
  const res = await axiosInstance.get<ApiResponse<Role>>(`/roles/${roleId}`);
  return res.data;
};

export const updateRole = async (roleId: number, data: UpdateRolePayload) => {
  const res = await axiosInstance.patch<ApiResponse<Role>>(
    `/roles/${roleId}`,
    data,
  );
  return res.data;
};

export const updateRolePermissions = async (
  roleId: number,
  data: UpdateRolePermissionsPayload,
) => {
  const res = await axiosInstance.put<ApiResponse<Role>>(
    `/roles/${roleId}/permissions`,
    data,
  );
  return res.data;
};

export const deleteRolePermissions = async (
  roleId: number,
  data: UpdateRolePermissionsPayload,
) => {
  const res = await axiosInstance.delete<ApiResponse<Role>>(
    `/roles/${roleId}/permissions`,
    { data },
  );
  return res.data;
};
