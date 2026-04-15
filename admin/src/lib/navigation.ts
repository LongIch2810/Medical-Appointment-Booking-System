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

export function getFirstAccessiblePath(userPermissions: Permission[] = []) {
  return getAccessibleMenu(userPermissions)[0]?.path ?? "/403";
}

export function findMenuByPath(pathname: string) {
  return menuItems.find((item) => item.path === pathname);
}
