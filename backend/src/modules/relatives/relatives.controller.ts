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
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RelativesService } from './relatives.service';
import { BodyFilterRelativesDto } from './dto/request/bodyFilterRelatives.dto';
import { BodyUpdateRelativeDto } from './dto/request/bodyUpdateRelative.dto';
import { BodyCreateRelativeDto } from './dto/request/bodyCreateRelative.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@ApiTags('relatives')
@ApiCookieAuth()
@Controller('relatives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RelativesController {
  constructor(private readonly relativesService: RelativesService) {}

  @ApiOperation({ summary: 'Tạo người thân' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.RELATIVE_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'relatives' })
  createRelative(@Request() req, @Body() body: BodyCreateRelativeDto) {
    const { userId } = req.user;
    return this.relativesService.create(userId, body);
  }

  @ApiOperation({ summary: 'Danh sách người thân của bệnh nhân' })
  @Get('patient/relatives')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.RELATIVE_READ)
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

  @ApiOperation({ summary: 'Chi tiết người thân' })
  @Get(':relativeId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.RELATIVE_READ)
  async getRelativeDetail(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.relativesService.getRelativeDetail(userId, relativeId);
  }

  @ApiOperation({ summary: 'Cập nhật người thân' })
  @Patch(':relativeId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.RELATIVE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'relatives' })
  async updateRelative(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
    @Body() bodyUpdateRelative: BodyUpdateRelativeDto,
  ) {
    const { userId } = req.user;
    return this.relativesService.update(userId, relativeId, bodyUpdateRelative);
  }

  @ApiOperation({ summary: 'Xóa người thân' })
  @Delete(':relativeId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.RELATIVE_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'relatives' })
  async deleteRelative(
    @Request() req,
    @Param('relativeId', ParseIntPipe) relativeId: number,
  ) {
    const { userId } = req.user;
    return this.relativesService.remove(userId, relativeId);
  }

  @ApiOperation({ summary: 'Danh sách người thân dành cho admin' })
  @Post('admin/relatives')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.RELATIVE_MANAGE)
  findAdminRelatives(@Body() bodyFilterRelatives: BodyFilterRelativesDto) {
    return this.relativesService.filterAndPagination(bodyFilterRelatives);
  }
}
