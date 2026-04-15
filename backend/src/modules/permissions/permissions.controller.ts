import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getPermissions() {
    return this.permissionsService.findAll();
  }
}
