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
import { CreateChannelDto } from './dto/request/createChannel.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestPaylaod } from 'src/shared/types/global.type';

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
  createChannel(@Request() req: any, @Body() body: CreateChannelDto) {
    const { userId } = req.user as RequestPaylaod;
    return this.channelsService.createChannel(body.member_ids, userId);
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
