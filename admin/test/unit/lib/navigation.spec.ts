import { menuItems } from '@/config/menu';
import {
  findMenuByPath,
  getAccessibleMenu,
  getFirstAccessiblePath,
  getWorkspaceMenu,
  groupMenuBySection,
  hasAnyPermission,
  hasPermissions,
} from '@/lib/navigation';

describe('navigation permission helpers', () => {
  it('handles all/any permission checks and absent sessions', () => {
    expect(hasPermissions(undefined, [] as never)).toBe(false);
    expect(hasPermissions(['a', 'b'] as never, ['a', 'b'] as never)).toBe(true);
    expect(hasPermissions(['a'] as never, ['a', 'b'] as never)).toBe(false);
    expect(hasAnyPermission(undefined, ['a'] as never)).toBe(false);
    expect(hasAnyPermission(['a'] as never, [] as never)).toBe(false);
    expect(hasAnyPermission(['a'] as never, ['b', 'a'] as never)).toBe(true);
  });

  it('filters the configured menu to accessible entries', () => {
    const item = menuItems.find((candidate) => candidate.requiredPermissions.length > 0)!;
    const result = getAccessibleMenu(item.requiredPermissions);
    expect(result).toContainEqual(item);
    expect(result.every((candidate) => candidate.requiredPermissions.every((permission) => item.requiredPermissions.includes(permission)))).toBe(true);
  });

  it('limits a workspace menu to the active role prefix', () => {
    const permissions = menuItems.flatMap((item) => item.requiredPermissions);
    expect(getWorkspaceMenu('admin', permissions).every((item) => item.path.startsWith('/admin/'))).toBe(true);
    expect(getWorkspaceMenu(null, permissions)).toEqual(getAccessibleMenu(permissions));
  });

  it('groups menu items by section without reordering them', () => {
    const grouped = groupMenuBySection(menuItems.slice(0, 3));
    expect(Object.values(grouped).flat()).toEqual(menuItems.slice(0, 3));
  });

  it('selects a role-local landing page and falls back to forbidden', () => {
    const adminItem = menuItems.find((item) => item.path.startsWith('/admin/') && item.requiredPermissions.length > 0)!;
    expect(getFirstAccessiblePath(adminItem.requiredPermissions, 'admin')).toBe(adminItem.path);
    expect(getFirstAccessiblePath([])).toBe('/403');
    expect(findMenuByPath(adminItem.path)).toEqual(adminItem);
  });
});

