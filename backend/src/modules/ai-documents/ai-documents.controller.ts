import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/utils/constants';
import { ChatHistoryService } from '../chat-history/chat-history.service';

@ApiTags('ai-documents')
@ApiCookieAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiDocumentsController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Get('health-roadmaps')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  getRoadmaps(
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
  getRoadmap(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chatHistoryService.getHealthRoadmap(req.user.userId, id);
  }

  @Get('health-roadmaps/:id/file')
  @Permissions(PERMISSIONS.CHATBOT_CHAT)
  async roadmapFile(
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
  deleteRoadmap(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chatHistoryService.deleteHealthRoadmap(req.user.userId, id);
  }

}
