/* eslint-disable */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ChannelsService } from './channels.service';
import { BodyFilterChannelsDto } from './dto/request/bodyFilterChannels.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('channels')
@ApiCookieAuth()
@Controller('channels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @ApiOperation({ summary: 'Tạo kênh chat' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.CHANNEL_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'channels' })
  createChannel(@Body() member_ids: number[]) {
    return this.channelsService.createChannel(member_ids);
  }

  @ApiOperation({
    summary: 'Danh sách kênh chat của người dùng đang đăng nhập',
  })
  @Post('/personal-channels')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHANNEL_READ)
  getPersonalChannels(
    @Request() req,
    @Body() objectFilters: BodyFilterChannelsDto,
  ) {
    const { userId } = req.user;
    return this.channelsService.findChannelsByUserId(userId, objectFilters);
  }

  @ApiOperation({ summary: 'Chi tiết kênh chat' })
  @Get(':channelId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHANNEL_READ)
  getChannelDetail(
    @Request() req,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    const { userId } = req.user;
    return this.channelsService.getChannel(channelId, userId);
  }
}
