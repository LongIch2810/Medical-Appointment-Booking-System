import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createRole,
  fetchRoleDetail,
  fetchRoles,
  updateRole,
  updateRolePermissions,
} from "@/api/roleApi";
import type {
  RoleListPayload,
  UpdateRolePayload,
} from "@/types/interface/role.interface";

export const roleQueryKeys = {
  list: (filters: RoleListPayload) => ["roles", filters] as const,
  detail: (roleId: number) => ["role-detail", roleId] as const,
};

export function useRoles(filters: RoleListPayload) {
  return useQuery({
    queryKey: roleQueryKeys.list(filters),
    queryFn: () => fetchRoles(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRoleDetail(roleId: number) {
  return useQuery({
    queryKey: roleQueryKeys.detail(roleId),
    queryFn: () => fetchRoleDetail(roleId),
    enabled: roleId > 0,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      toast.success("Tạo vai trò thành công");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () => {
      toast.error("Tạo vai trò thất bại");
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: UpdateRolePayload;
    }) => updateRole(roleId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật vai trò thành công");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({
        queryKey: roleQueryKeys.detail(variables.roleId),
      });
    },
    onError: () => {
      toast.error("Cập nhật vai trò thất bại");
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => updateRolePermissions(roleId, permissionIds),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật quyền thành công");
      queryClient.invalidateQueries({
        queryKey: roleQueryKeys.detail(variables.roleId),
      });
      queryClient.invalidateQueries({ queryKey: ["role-permission-matrix"] });
    },
    onError: () => {
      toast.error("Cập nhật quyền thất bại");
    },
  });
}
