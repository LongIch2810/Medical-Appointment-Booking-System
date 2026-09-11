import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/utils/constants';
import { RolePermissionService } from 'src/modules/role-permission/role-permission.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionService: RolePermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) return true;

    const req = context.switchToHttp().getRequest();
    if (!req.user) {
      throw new UnauthorizedException(
        'Không tìm thấy người dùng trong yêu cầu',
      );
    }
    const { userId, roles } = req.user;
    const userPermissions: string[] =
      await this.rolePermissionService.getPermissionsByRoles(userId, roles);
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }
    return true;
  }
}
