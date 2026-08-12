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
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateTagDto } from './dto/request/bodyCreateTag.dto';
import { BodyFilterTagsDto } from './dto/request/bodyFilterTags.dto';
import { BodyUpdateTagDto } from './dto/request/bodyUpdateTag.dto';
import { TagsService } from './tags.service';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@ApiTags('tags')
@ApiCookieAuth()
@Controller('tags')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOperation({ summary: 'Danh sách thẻ (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.TAG_READ)
  async getTags(@Body() bodyFilterTags: BodyFilterTagsDto) {
    return this.tagsService.filterAndPagination(bodyFilterTags);
  }

  @ApiOperation({ summary: 'Tạo thẻ' })
  @Post('create-tag')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.TAG_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'tags' })
  async createTag(@Body() bodyCreateTag: BodyCreateTagDto) {
    return this.tagsService.create(bodyCreateTag);
  }

  @ApiOperation({ summary: 'Chi tiết thẻ' })
  @Get(':tagId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.TAG_READ)
  async getTagDetail(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.findById(tagId);
  }

  @ApiOperation({ summary: 'Cập nhật thẻ' })
  @Patch(':tagId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.TAG_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'tags' })
  async updateTag(
    @Param('tagId', ParseIntPipe) tagId: number,
    @Body() bodyUpdateTag: BodyUpdateTagDto,
  ) {
    return this.tagsService.update(tagId, bodyUpdateTag);
  }

  @ApiOperation({ summary: 'Xóa thẻ' })
  @Delete(':tagId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.TAG_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'tags' })
  async deleteTag(@Param('tagId', ParseIntPipe) tagId: number) {
    return this.tagsService.remove(tagId);
  }
}
