import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsService } from './permissions.service';
import { BodyFilterPermissionsDto } from './dto/request/bodyFilterPermissions.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Post()
  async getFilterPermissions(@Body() objectFilters: BodyFilterPermissionsDto) {
    const result = await this.permissionsService.filterAndPagination(objectFilters);
    return result;
  }

  @Get(':permissionId')
  async getPermissionDetail(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const permission = await this.permissionsService.getPermissionDetail(
      permissionId,
    );
    return permission;
  }

}
