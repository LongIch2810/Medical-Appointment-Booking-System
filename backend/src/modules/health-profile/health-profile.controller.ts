import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { HealthProfileService } from './health-profile.service';
import { BodyFilterHealthProfilesDto } from './dto/request/bodyFilterHealthProfiles.dto';
import { BodyUpdateHealthProfileDto } from './dto/request/bodyUpdateHealthProfile.dto';

@Controller('health-profiles')
@UseGuards(JwtAuthGuard)
export class HealthProfileController {
  constructor(private readonly healthProfileService: HealthProfileService) {}

  @Post('patient/list')
  async getListHealthProfilesByPersonal(
    @Request() req,
    @Body() objectFilters: BodyFilterHealthProfilesDto,
  ) {
    const { userId } = req.user;
    return this.healthProfileService.listHealthProfilesByUserId(
      userId,
      objectFilters,
    );
  }

  @Patch('update/:id')
  async updateHealthProfile(
    @Request() req,
    @Param('id', ParseIntPipe) relativeId: number,
    @Body() bodyUpdateHealProfile: Partial<BodyUpdateHealthProfileDto>,
  ) {
    const { userId } = req.user;
    const { message } = await this.healthProfileService.update(
      userId,
      relativeId,
      bodyUpdateHealProfile,
    );
    return message;
  }

  @Get(':relativeId')
  async getHealthProfileByRelativeId(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.healthProfileService.getHealthProfile(userId, relativeId);
  }

  @Post('admin/list')
  async filterAndPagination(
    @Body() objectFilters: BodyFilterHealthProfilesDto,
  ) {
    return this.healthProfileService.filterAndPagination(objectFilters);
  }
}
