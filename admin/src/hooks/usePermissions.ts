import { useQuery } from "@tanstack/react-query";

import { fetchPermissionDetail, fetchPermissions } from "@/api/permissionApi";
import type { PermissionListPayload } from "@/types/interface/permission.interface";

export const permissionQueryKeys = {
  list: (filters: PermissionListPayload) => ["permissions", filters] as const,
  detail: (permissionId: number) =>
    ["permission-detail", permissionId] as const,
};

export function usePermissions(filters: PermissionListPayload) {
  return useQuery({
    queryKey: permissionQueryKeys.list(filters),
    queryFn: () => fetchPermissions(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function usePermissionDetail(permissionId: number) {
  return useQuery({
    queryKey: permissionQueryKeys.detail(permissionId),
    queryFn: () => fetchPermissionDetail(permissionId),
    enabled: permissionId > 0,
  });
}
