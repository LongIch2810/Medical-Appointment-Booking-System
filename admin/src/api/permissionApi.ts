import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  Permission,
  PermissionListPayload,
  PermissionListResponse,
} from "@/types/interface/permission.interface";

export const fetchPermissions = async (data: PermissionListPayload) => {
  const res = await axiosInstance.post<ApiResponse<PermissionListResponse>>(
    "/permissions",
    data,
  );
  return res.data;
};

export const fetchPermissionDetail = async (permissionId: number) => {
  const res = await axiosInstance.get<ApiResponse<Permission>>(
    `/permissions/${permissionId}`,
  );
  return res.data;
};
