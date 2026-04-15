import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyAssignRolePermissionsDto } from './dto/bodyAssignRolePermissions.dto';
import { RolePermissionService } from './role-permission.service';

@Controller('role-permission')
@UseGuards(JwtAuthGuard)
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get(':roleId')
  async getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionService.getRolePermissions(roleId);
  }

  @Patch(':roleId')
  async assignRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() bodyAssignRolePermissions: BodyAssignRolePermissionsDto,
  ) {
    return this.rolePermissionService.assignPermissions(
      roleId,
      bodyAssignRolePermissions,
    );
  }
}
