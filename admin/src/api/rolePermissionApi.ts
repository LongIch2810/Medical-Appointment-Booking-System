import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { RolePermissionMatrix } from "@/types/interface/rolePermission.interface";

export const fetchRolePermissionMatrix = async () => {
  const res = await axiosInstance.get<ApiResponse<RolePermissionMatrix>>(
    "/role-permission/matrix",
  );
  return res.data;
};
