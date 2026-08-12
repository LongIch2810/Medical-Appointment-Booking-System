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
import { ChatHistoryService } from './chat-history.service';
import { BodyMessageDto } from './dto/request/bodyMessage.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ConfigService } from '@nestjs/config';
import { BodyChatDto } from './dto/request/bodyChat.dto';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('chat-history')
@ApiCookieAuth()
@Controller('chat-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatHistoryController {
  constructor(private chatHistoryService: ChatHistoryService) {}

  @ApiOperation({ summary: 'Ngữ cảnh hội thoại gần nhất của người dùng' })
  @Get('/context/:userId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async getChatHistoryContext(@Param('userId', ParseIntPipe) userId: number) {
    const history = await this.chatHistoryService.getChatHistoryContext(userId);
    return history.reverse();
  }

  @ApiOperation({ summary: 'Lưu lịch sử hội thoại' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async saveMessage(@Body() body: BodyMessageDto) {
    const { userId, role, content } = body;
    await this.chatHistoryService.saveMessage(userId, role, content);
    return { message: 'Message saved successfully' };
  }

  @ApiOperation({ summary: 'Gửi tin nhắn tới chatbot' })
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async chatWithChatbot(@Request() req, @Body() body: BodyChatDto) {
    const { userId } = req.user;
    const { accessToken: token } = req.cookies;
    const { question } = body;
    const answer = await this.chatHistoryService.chatbotAnswer(
      userId,
      question,
      token,
    );
    return { answer };
  }

  @ApiOperation({ summary: 'Lịch sử hội thoại của người dùng' })
  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getChatHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    return this.chatHistoryService.getChatHistory(userId, page);
  }
}
