import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { BodyFilterRelationshipsDto } from './dto/request/bodyFilterRelationships.dto';
import { BodyCreateRelationshipDto } from './dto/request/bodyCreateRelationship.dto';
import { BodyUpdateRelationshipDto } from './dto/request/bodyUpdateRelationship.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getFilterRelationships(
    @Body() objectFilters: BodyFilterRelationshipsDto,
  ) {
    const result =
      await this.relationshipsService.filterAndPagination(objectFilters);
    return result;
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.RELATIONSHIP_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'relationships' })
  async createRelationship(@Body() body: BodyCreateRelationshipDto) {
    return this.relationshipsService.create(body);
  }

  @Get(':relationshipCode')
  @HttpCode(HttpStatus.OK)
  async getRelationshipDetail(
    @Param('relationshipCode') relationshipCode: string,
  ) {
    return this.relationshipsService.getRelationshipDetail(relationshipCode);
  }

  @Patch(':relationshipCode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.RELATIONSHIP_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'relationships' })
  async updateRelationship(
    @Param('relationshipCode') relationshipCode: string,
    @Body() body: BodyUpdateRelationshipDto,
  ) {
    return this.relationshipsService.update(relationshipCode, body);
  }

  @Delete(':relationshipCode')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.RELATIONSHIP_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'relationships' })
  async deleteRelationship(
    @Param('relationshipCode') relationshipCode: string,
  ) {
    return this.relationshipsService.remove(relationshipCode);
  }
}
