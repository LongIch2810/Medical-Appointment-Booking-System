import { useMemo } from "react";

import { hasAnyPermission, hasPermissions } from "@/lib/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { Permission } from "@/types/app";

/**
 * Hook tiện dụng kiểm tra quyền từ phía UI.
 * - `can(...candidates)`: trả về true nếu user có ít nhất 1 trong số `candidates`.
 * - `canAll(...required)`: trả về true nếu user có TẤT CẢ quyền trong `required`.
 *
 * Quy ước backend: ngoài quyền action-level (vd `tag:create`), luôn xét thêm
 * quyền `*:manage` tương ứng (vd `tag:manage`) để giữ tương thích vai trò admin.
 */
export function usePermission() {
  const userPermissions = useAuthStore((state) => state.permissions);

  return useMemo(
    () => ({
      permissions: userPermissions,
      can: (...candidates: Permission[]) =>
        hasAnyPermission(userPermissions, candidates),
      canAll: (...required: Permission[]) =>
        hasPermissions(userPermissions, required),
    }),
    [userPermissions],
  );
}
