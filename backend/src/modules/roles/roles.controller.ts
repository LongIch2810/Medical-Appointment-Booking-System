import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateRoleDto } from './dto/request/bodyCreateRole.dto';
import { BodyFilterRolesDto } from './dto/request/bodyFilterRoles.dto';
import { BodyUpdateRoleDto } from './dto/request/bodyUpdateRole.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async getRoles(@Body() bodyFilterRoles: BodyFilterRolesDto) {
    return this.rolesService.filterAndPagination(bodyFilterRoles);
  }

  @Post('create-role')
  async createRole(@Body() bodyCreateRole: BodyCreateRoleDto) {
    return this.rolesService.create(bodyCreateRole);
  }

  @Get(':roleId')
  async getRoleDetail(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolesService.findById(roleId);
  }

  @Patch(':roleId')
  async updateRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() bodyUpdateRole: BodyUpdateRoleDto,
  ) {
    return this.rolesService.update(roleId, bodyUpdateRole);
  }
}
