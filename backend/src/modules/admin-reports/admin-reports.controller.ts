import {
  Body,
  Controller,
  Delete,
  HttpException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Param,
  ParseIntPipe,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS } from 'src/utils/constants';
import { AdminReportsService } from './admin-reports.service';
import {
  CreateReportAssistantConversationDto,
  ReportAssistantMessageDto,
} from './dto/request/reportAssistantMessage.dto';
import type { Response } from 'express';
import { getRequestAccessToken } from 'src/utils/authContext';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMIT_POLICIES } from 'src/common/rate-limit/rate-limit.constants';
import { RevealReportQueryDto } from './dto/request/revealReportQuery.dto';

@ApiTags('admin-reports')
@ApiCookieAuth()
@Controller('admin-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @ApiOperation({ summary: 'Tạo hội thoại trợ lý báo cáo AI' })
  @Post('assistant/conversations')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async createAssistantConversation(
    @Request() req,
    @Body() body: CreateReportAssistantConversationDto,
  ) {
    const token = getRequestAccessToken(req);
    if (!token) {
      throw new HttpException('Token không hợp lệ.', HttpStatus.UNAUTHORIZED);
    }
    return this.adminReportsService.createAssistantConversation(
      req.user.userId,
      token,
      body,
    );
  }

  @ApiOperation({ summary: 'Danh sách hội thoại trợ lý báo cáo của admin' })
  @Get('assistant/conversations')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async listAssistantConversations(
    @Request() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminReportsService.listAssistantConversations(
      req.user.userId,
      Number(page),
      Number(limit),
    );
  }

  @ApiOperation({ summary: 'Đọc hội thoại trợ lý báo cáo' })
  @Get('assistant/conversations/:id')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async getAssistantConversation(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('beforeMessageId') beforeMessageId?: string,
    @Query('limit') limit = '50',
  ) {
    return this.adminReportsService.getAssistantConversation(
      req.user.userId,
      id,
      beforeMessageId ? Number(beforeMessageId) : undefined,
      Number(limit),
    );
  }

  @ApiOperation({ summary: 'Gửi tin nhắn hoặc xác nhận kế hoạch báo cáo' })
  @Post('assistant/conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async sendAssistantMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReportAssistantMessageDto,
  ) {
    const token = getRequestAccessToken(req);
    if (!token) {
      throw new HttpException('Token không hợp lệ.', HttpStatus.UNAUTHORIZED);
    }
    return this.adminReportsService.sendAssistantMessage(
      req.user.userId,
      token,
      id,
      body,
    );
  }

  @Get('history')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async history(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('reportType') reportType?: string,
  ) {
    return this.adminReportsService.history(
      Number(page),
      Number(limit),
      reportType,
    );
  }

  @Get('history/:id')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.adminReportsService.detail(id);
  }

  @ApiOperation({ summary: 'Xác nhận mật khẩu để xem SQL đã thực thi' })
  @Post('history/:id/reveal-query')
  @HttpCode(HttpStatus.OK)
  @Throttle(RATE_LIMIT_POLICIES.login)
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async revealQuery(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RevealReportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return {
      executedQuery: await this.adminReportsService.revealQuery(
        req.user.userId,
        id,
        body.password,
      ),
    };
  }

  @Get('history/:id/file-url')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async fileUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
  ) {
    return {
      url: await this.adminReportsService.file(id, download === 'true'),
    };
  }

  @Get('history/:id/file')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async file(
    @Param('id', ParseIntPipe) id: number,
    @Query('download') download: string,
    @Res() response: Response,
  ) {
    response.redirect(
      await this.adminReportsService.file(id, download === 'true'),
    );
  }

  @Delete('history/:id')
  @Permissions(PERMISSIONS.AI_COACH_REPORT_READ)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.adminReportsService.remove(
      id,
      req.user.userId,
      req.user.roles ?? [],
    );
  }
}
