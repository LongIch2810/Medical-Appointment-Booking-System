import {
  Body,
  Controller,
  Get,
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

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  handleSaveMessage(@Body() bodyCreateMessage: BodyCreateMessageDto) {
    return this.messagesService.saveMessage(bodyCreateMessage);
  }

  @Get(':channelId')
  getMessagesByChannelId(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.messagesService.getMessageByChannelId(channelId, page);
  }
}
