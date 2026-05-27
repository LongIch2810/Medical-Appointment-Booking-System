import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { PermissionsService } from './permissions.service';
import { BodyFilterPermissionsDto } from './dto/request/bodyFilterPermissions.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.PERMISSION_READ)
  async getFilterPermissions(@Body() objectFilters: BodyFilterPermissionsDto) {
    const result =
      await this.permissionsService.filterAndPagination(objectFilters);
    return result;
  }

  @Get(':permissionId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.PERMISSION_READ)
  async getPermissionDetail(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const permission =
      await this.permissionsService.getPermissionDetail(permissionId);
    return permission;
  }
}
