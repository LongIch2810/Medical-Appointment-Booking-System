import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RelativesService } from './relatives.service';
import { BodyFilterRelativesDto } from './dto/request/bodyFilterRelatives.dto';
import { BodyUpdateRelativeDto } from './dto/request/bodyUpdateRelative.dto';
import { BodyCreateRelativeDto } from './dto/request/bodyCreateRelative.dto';

@Controller('relatives')
@UseGuards(JwtAuthGuard)
export class RelativesController {
  constructor(private readonly relativesService: RelativesService) {}

  @Post()
  createRelative(@Request() req, @Body() body: BodyCreateRelativeDto) {
    const { userId } = req.user;
    return this.relativesService.create(userId, body);
  }

  @Get('patient/relatives')
  findRelatives(@Request() req, @Query() query: Record<string, string>) {
    const { userId } = req.user;
    const bodyFilterRelatives: BodyFilterRelativesDto = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search || query.name,
      relationshipCode:
        query.relationshipCode || query.relationship_code || undefined,
      arrange:
        query.arrange === 'asc' || query.arrange === 'desc'
          ? query.arrange
          : 'desc',
    };
    return this.relativesService.findRelativesByUserId(
      userId,
      bodyFilterRelatives,
    );
  }

  @Get(':relativeId')
  async getRelativeDetail(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.relativesService.getRelativeDetail(userId, relativeId);
  }

  @Patch(':relativeId')
  async updateRelative(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
    @Body() bodyUpdateRelative: BodyUpdateRelativeDto,
  ) {
    const { userId } = req.user;
    return this.relativesService.update(userId, relativeId, bodyUpdateRelative);
  }

  @Delete(':relativeId')
  async deleteRelative(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.relativesService.remove(userId, relativeId);
  }

  @Post('admin/relatives')
  findAdminRelatives(@Body() bodyFilterRelatives: BodyFilterRelativesDto) {
    return this.relativesService.filterAndPagination(bodyFilterRelatives);
  }
}
