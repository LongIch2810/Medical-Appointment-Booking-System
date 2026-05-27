import { menuItems } from "@/config/menu";
import type { AppRole, MenuItem, Permission } from "@/types/app";

export function hasPermissions(
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[]
) {
  if (!userPermissions) return false;
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

export function hasAnyPermission(
  userPermissions: Permission[] | undefined,
  candidates: Permission[]
) {
  if (!userPermissions || candidates.length === 0) return false;
  return candidates.some((permission) => userPermissions.includes(permission));
}

export function getAccessibleMenu(userPermissions: Permission[] = []) {
  return menuItems.filter((item) =>
    hasPermissions(userPermissions, item.requiredPermissions)
  );
}

export function getWorkspaceMenu(
  role: AppRole | null,
  userPermissions: Permission[] = []
) {
  const accessibleItems = getAccessibleMenu(userPermissions);

  if (!role) return accessibleItems;

  const prefix = `/${role}/`;
  return accessibleItems.filter((item) => item.path.startsWith(prefix));
}

export function groupMenuBySection(items: MenuItem[]) {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
}

export function getFirstAccessiblePath(
  userPermissions: Permission[] = [],
  role?: AppRole | null,
) {
  const accessible = getAccessibleMenu(userPermissions);
  if (accessible.length === 0) return "/403";

  // Ưu tiên menu theo workspace của vai trò hiện tại để tránh redirect lệch.
  // Ví dụ: admin có cả quyền doctor sẽ vẫn vào `/admin/dashboard` trước.
  if (role) {
    const prefix = `/${role}/`;
    const workspaceItem = accessible.find((item) =>
      item.path.startsWith(prefix),
    );
    if (workspaceItem) return workspaceItem.path;
  }

  return accessible[0].path;
}

export function findMenuByPath(pathname: string) {
  return menuItems.find((item) => item.path === pathname);
}
