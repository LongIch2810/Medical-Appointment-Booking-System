import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { BodyCreateMessageDto } from './dto/request/bodyCreateMessage.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.MESSAGE_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'messages' })
  handleSaveMessage(@Body() bodyCreateMessage: BodyCreateMessageDto) {
    return this.messagesService.saveMessage(bodyCreateMessage);
  }

  @Get(':channelId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.MESSAGE_READ)
  getMessagesByChannelId(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.messagesService.getMessageByChannelId(channelId, page);
  }
}
