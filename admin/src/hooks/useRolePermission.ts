import { useQuery } from "@tanstack/react-query";

import { fetchRolePermissionMatrix } from "@/api/rolePermissionApi";

export const rolePermissionQueryKeys = {
  matrix: ["role-permission-matrix"] as const,
};

export function useRolePermissionMatrix() {
  return useQuery({
    queryKey: rolePermissionQueryKeys.matrix,
    queryFn: fetchRolePermissionMatrix,
    staleTime: 1000 * 60 * 5,
  });
}
