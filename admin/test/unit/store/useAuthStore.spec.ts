import {
  canAccessAdminConsole,
  derivePermissions,
  deriveRole,
  readRoleNames,
  useAuthStore,
} from '@/store/useAuthStore';

describe('admin auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('normalizes role names and gives admin precedence', () => {
    const user = { roles: [{ role_name: 'doctor' }, { role_name: 'admin' }] } as never;
    expect(readRoleNames(user)).toEqual(['DOCTOR', 'ADMIN']);
    expect(deriveRole(user)).toBe('admin');
    expect(deriveRole({ roles: [{ role_name: 'DOCTOR' }] } as never)).toBe('doctor');
    expect(deriveRole(null)).toBeNull();
  });

  it('only allows staff roles into the admin console', () => {
    expect(canAccessAdminConsole(null)).toBe(false);
    expect(canAccessAdminConsole({ isAdmin: true } as never)).toBe(true);
    expect(canAccessAdminConsole({ roles: [{ role_name: 'PATIENT' }] } as never)).toBe(false);
    expect(canAccessAdminConsole({ roles: [{ role_name: 'DOCTOR' }] } as never)).toBe(true);
  });

  it('deduplicates explicit and role-provided backend permissions', () => {
    const permissions = derivePermissions({
      permissions: ['users.read', 'users.read'],
      roles: [{ role_name: 'DOCTOR', permissions: [{ name: 'appointments.read' }, { name: 'users.read' }] }],
    } as never);
    expect(new Set(permissions)).toEqual(new Set(['users.read', 'appointments.read']));
  });

  it('sets and clears all derived session state atomically', () => {
    useAuthStore.getState().setSession({
      id: 4,
      roles: [{ role_name: 'DOCTOR' }],
      permissions: ['appointments.read'],
    } as never);
    expect(useAuthStore.getState()).toMatchObject({ currentRole: 'doctor', permissions: ['appointments.read'] });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({ currentUser: null, currentRole: null, permissions: [] });
  });
});

