import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { RolePermissionService } from './role-permission.service';
import { RolePermissionMatrixResponseDto } from './dto/response/rolePermissionMatrixResponse.dto';

@Controller('role-permission')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get('matrix')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_PERMISSION_READ)
  @AuditLogAction({ action: 'READ', entityName: 'role-permission.matrix' })
  getMatrix(): Promise<RolePermissionMatrixResponseDto> {
    return this.rolePermissionService.getMatrix();
  }
}
