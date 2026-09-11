import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  MAX_MEDICAL_RECORD_FILE_SIZE_BYTES,
  MAX_MEDICAL_RECORD_FILES,
  MedicalRecordUploadFields,
  parseMedicalRecordUpload,
} from './medical-record-upload';

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
    const { accessToken: token } = req.cookies;
    const { question } = body;
    const answer = await this.chatHistoryService.chatbotAnswer(
      userId,
      question,
      token,
    );
    return { answer };
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
    const { accessToken: token } = req.cookies;

    return this.chatHistoryService.buildHealthRoadmap(
      userId,
      body.relative_id,
      token,
    );
  }

  @ApiOperation({ summary: 'Tóm tắt bệnh án bằng AI' })
  @Post('summary-medical-record')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: MAX_MEDICAL_RECORD_FILES },
        { name: 'pdf', maxCount: 1 },
      ],
      {
        limits: {
          files: MAX_MEDICAL_RECORD_FILES,
          fileSize: MAX_MEDICAL_RECORD_FILE_SIZE_BYTES,
        },
      },
    ),
  )
  async summarizeMedicalRecord(
    @Request() req,
    @UploadedFiles() files: MedicalRecordUploadFields,
  ) {
    const { userId } = req.user;
    const { accessToken: token } = req.cookies;
    const upload = parseMedicalRecordUpload(files ?? {});
    const summary = await this.chatHistoryService.summarizeMedicalRecord(
      userId,
      token,
      upload,
    );
    return { summary };
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
