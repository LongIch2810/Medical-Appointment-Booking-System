import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolePermissionService } from 'src/modules/role-permission/role-permission.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let rolePermissionService: { getPermissionsByRoles: jest.Mock };

  const makeContext = (user?: unknown): ExecutionContext => {
    const req = user !== undefined ? { user } : {};
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    rolePermissionService = { getPermissionsByRoles: jest.fn() };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      rolePermissionService as unknown as RolePermissionService,
    );
  });

  it('allows the request when the handler has no @Permissions metadata', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = makeContext({ userId: 1, roles: ['PATIENT'] });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rolePermissionService.getPermissionsByRoles).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when req.user is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(['appointment:read']);
    const context = makeContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(rolePermissionService.getPermissionsByRoles).not.toHaveBeenCalled();
  });

  it('allows the request when the user holds every required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      'appointment:read',
      'appointment:create',
    ]);
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      'appointment:read',
      'appointment:create',
      'appointment:cancel',
    ]);
    const context = makeContext({ userId: 7, roles: ['DOCTOR'] });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rolePermissionService.getPermissionsByRoles).toHaveBeenCalledWith(
      7,
      ['DOCTOR'],
    );
  });

  it('throws ForbiddenException when the user is missing at least one required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      'appointment:read',
      'appointment:manage',
    ]);
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      'appointment:read',
    ]);
    const context = makeContext({ userId: 3, roles: ['PATIENT'] });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('requires ALL permissions, not just one, when several are declared', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      'user:read',
      'user:update',
      'user:manage',
    ]);
    rolePermissionService.getPermissionsByRoles.mockResolvedValue([
      'user:read',
      'user:update',
    ]);
    const context = makeContext({ userId: 9, roles: ['ADMIN'] });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
