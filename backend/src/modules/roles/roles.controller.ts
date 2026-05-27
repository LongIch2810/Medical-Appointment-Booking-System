import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateRoleDto } from './dto/request/bodyCreateRole.dto';
import { BodyFilterRolesDto } from './dto/request/bodyFilterRoles.dto';
import { BodyUpdateRoleDto } from './dto/request/bodyUpdateRole.dto';
import { BodyUpdateRolePermissionsDto } from './dto/request/bodyUpdateRolePermissions.dto';
import { RolesService } from './roles.service';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_READ)
  async getRoles(@Body() bodyFilterRoles: BodyFilterRolesDto) {
    return this.rolesService.filterAndPagination(bodyFilterRoles);
  }

  @Post('create-role')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.ROLE_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'roles' })
  async createRole(@Body() bodyCreateRole: BodyCreateRoleDto) {
    return this.rolesService.create(bodyCreateRole);
  }

  @Get(':roleId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_READ)
  async getRoleDetail(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolesService.findById(roleId);
  }

  @Patch(':roleId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'roles' })
  async updateRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() bodyUpdateRole: BodyUpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, bodyUpdateRole);
  }

  @Put(':roleId/permissions')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_PERMISSION_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'roles.permissions' })
  async updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: BodyUpdateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(roleId, body.permission_ids);
  }

  @Delete(':roleId/permissions')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.ROLE_PERMISSION_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'roles.permissions' })
  async deleteRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: BodyUpdateRolePermissionsDto,
  ) {
    return this.rolesService.deleteRolePermissions(roleId, body.permission_ids);
  }
}
