import {
  Body,
  Controller,
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
import { MessagesService } from './messages.service';
import { BodyCreateMessageDto } from './dto/request/bodyCreateMessage.dto';
import { QueryMessagesDto } from './dto/request/queryMessages.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestPaylaod } from 'src/shared/types/global.type';

@ApiTags('messages')
@ApiCookieAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Gửi tin nhắn' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.MESSAGE_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'messages' })
  handleSaveMessage(
    @Request() req: any,
    @Body() bodyCreateMessage: BodyCreateMessageDto,
  ) {
    const { userId } = req.user as RequestPaylaod;
    return this.messagesService.saveMessage(bodyCreateMessage, userId);
  }

  @ApiOperation({ summary: 'Danh sách tin nhắn theo kênh' })
  @Get(':channelId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.MESSAGE_READ)
  getMessagesByChannelId(
    @Request() req: any,
    @Param('channelId', ParseIntPipe) channelId: number,
    @Query() query: QueryMessagesDto,
  ) {
    const { userId } = req.user as RequestPaylaod;
    return this.messagesService.getMessageByChannelId(
      channelId,
      userId,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Đánh dấu đã đọc toàn bộ tin nhắn trong kênh' })
  @Patch(':channelId/read')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.MESSAGE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'messages' })
  markChannelMessagesAsRead(
    @Request() req: any,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    const { userId } = req.user as RequestPaylaod;
    return this.messagesService.markChannelMessagesAsRead(channelId, userId);
  }
}
