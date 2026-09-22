import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { BodyMessageDto } from './dto/request/bodyMessage.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyChatDto } from './dto/request/bodyChat.dto';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BodyBuildHealthRoadmapDto } from './dto/request/bodyBuildHealthRoadmap.dto';
import type { Response } from 'express';
import { getRequestAccessToken } from 'src/utils/authContext';
import { SendPatientChatMessageDto } from './dto/request/patientChat.dto';

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
  async getChatHistoryContext(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const { userId: authenticatedUserId } = req.user;
    if (userId !== authenticatedUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập lịch sử này.');
    }
    const history =
      await this.chatHistoryService.getChatHistoryContext(authenticatedUserId);
    return history.reverse();
  }

  @ApiOperation({ summary: 'Lưu lịch sử hội thoại' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async saveMessage(@Request() req, @Body() body: BodyMessageDto) {
    const { userId } = req.user;
    const { role, content } = body;
    await this.chatHistoryService.saveMessage(userId, role, content);
    return { message: 'Message saved successfully' };
  }

  @ApiOperation({ summary: 'Gửi tin nhắn tới chatbot' })
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async chatWithChatbot(@Request() req, @Body() body: BodyChatDto) {
    const { userId } = req.user;
    const token = getRequestAccessToken(req);
    if (!token) throw new UnauthorizedException('Token không hợp lệ.');
    const { question } = body;
    const answer = await this.chatHistoryService.chatbotAnswer(
      userId,
      question,
      token,
    );
    return { answer };
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  createPatientChatConversation(@Request() req) {
    return this.chatHistoryService.createPatientChatConversation(
      req.user.userId,
    );
  }

  @Get('conversations')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  listPatientChatConversations(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.chatHistoryService.listPatientChatConversations(
      req.user.userId,
      Number(page),
      Number(limit),
    );
  }

  @Get('conversations/:id')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getPatientChatConversation(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('beforeMessageId') beforeMessageId?: string,
    @Query('limit') limit = '50',
  ) {
    return this.chatHistoryService.getPatientChatConversation(
      req.user.userId,
      id,
      beforeMessageId ? Number(beforeMessageId) : undefined,
      Number(limit),
    );
  }

  @Delete('conversations/:id')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  deletePatientChatConversation(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const token = getRequestAccessToken(req);
    if (!token) throw new UnauthorizedException('Token không hợp lệ.');
    return this.chatHistoryService.deletePatientChatConversation(
      req.user.userId,
      id,
      token,
    );
  }

  @Post('conversations/:id/messages')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  sendPatientChatMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SendPatientChatMessageDto,
  ) {
    const token = getRequestAccessToken(req);
    if (!token) throw new UnauthorizedException('Token không hợp lệ.');
    return this.chatHistoryService.sendPatientChatMessage(
      req.user.userId,
      id,
      token,
      body,
    );
  }

  @ApiOperation({ summary: 'Tạo lộ trình sức khỏe bằng AI cho một hồ sơ' })
  @Post('build-health-roadmap')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async buildHealthRoadmap(
    @Request() req,
    @Body() body: BodyBuildHealthRoadmapDto,
  ) {
    const { userId } = req.user;
    const token = getRequestAccessToken(req);
    if (!token) throw new UnauthorizedException('Token không hợp lệ.');

    return this.chatHistoryService.buildHealthRoadmap(
      userId,
      body.relative_id,
      token,
    );
  }

  @Get('health-roadmaps')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getHealthRoadmapHistory(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('relativeId') relativeId?: string,
  ) {
    return this.chatHistoryService.getHealthRoadmapHistory(
      req.user.userId,
      Number(page),
      Number(limit),
      relativeId ? Number(relativeId) : undefined,
    );
  }

  @Get('health-roadmaps/:id')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getHealthRoadmap(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chatHistoryService.getHealthRoadmap(req.user.userId, id);
  }

  @Get('health-roadmaps/:id/file')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async getHealthRoadmapFile(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
    @Res() response: Response,
  ) {
    response.redirect(
      await this.chatHistoryService.getHealthRoadmapFile(
        req.user.userId,
        id,
        download === 'true',
      ),
    );
  }

  @Delete('health-roadmaps/:id')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  deleteHealthRoadmap(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chatHistoryService.deleteHealthRoadmap(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Lịch sử hội thoại của người dùng' })
  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getChatHistory(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page: number,
  ) {
    const { userId: authenticatedUserId } = req.user;
    if (userId !== authenticatedUserId) {
      throw new ForbiddenException('Bạn không có quyền truy cập lịch sử này.');
    }
    return this.chatHistoryService.getChatHistory(authenticatedUserId, page);
  }
}
