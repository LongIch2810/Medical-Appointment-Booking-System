import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateExaminationResultDto } from './dto/request/bodyCreateExaminationResult.dto';
import { BodyFilterExaminationResultsDto } from './dto/request/bodyFilterExaminationResult.dto';
import { BodyUpdateExaminationResultDto } from './dto/request/bodyUpdateExaminationResult.dto';
import { ExaminationResultService } from './examination-result.service';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('examination-result')
@ApiCookieAuth()
@Controller('examination-result')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExaminationResultController {
  constructor(
    private readonly examinationResultService: ExaminationResultService,
  ) {}

  @ApiOperation({ summary: 'Danh sách kết quả khám (phân trang, lọc)' })
  @Post()
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_READ)
  async getExaminationResults(
    @Body() bodyFilterExaminationResults: BodyFilterExaminationResultsDto,
  ) {
    return this.examinationResultService.filterAndPagination(
      bodyFilterExaminationResults,
    );
  }

  @ApiOperation({ summary: 'Tạo kết quả khám' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'examination-result' })
  async createExaminationResult(
    @Request() req,
    @Body() bodyCreateExaminationResult: BodyCreateExaminationResultDto,
  ) {
    const { userId } = req.user;
    return this.examinationResultService.create(
      userId,
      bodyCreateExaminationResult,
    );
  }

  @ApiOperation({ summary: 'Danh sách kết quả khám cá nhân' })
  @Post('personal/list')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_READ)
  async getPersonalExaminationResults(
    @Request() req,
    @Body() bodyFilterExaminationResults: BodyFilterExaminationResultsDto,
  ) {
    const { userId } = req.user;
    return this.examinationResultService.findExaminationResultsByUserId(
      userId,
      bodyFilterExaminationResults,
    );
  }

  @ApiOperation({ summary: 'Chi tiết kết quả khám' })
  @Get(':resultId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_READ)
  async getExaminationResultDetail(
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    return this.examinationResultService.getExaminationResultDetail(resultId);
  }

  @ApiOperation({ summary: 'Cập nhật kết quả khám' })
  @Patch(':resultId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'examination-result' })
  async updateExaminationResult(
    @Request() req,
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() bodyUpdateExaminationResult: BodyUpdateExaminationResultDto,
  ) {
    const { userId } = req.user;
    return this.examinationResultService.update(
      userId,
      resultId,
      bodyUpdateExaminationResult,
    );
  }

  @ApiOperation({ summary: 'Xóa kết quả khám' })
  @Delete(':resultId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'examination-result' })
  async deleteExaminationResult(
    @Request() req,
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    const { userId } = req.user;
    return this.examinationResultService.remove(userId, resultId);
  }

  @ApiOperation({
    summary: 'Danh sách kết quả khám do bác sĩ đang đăng nhập tạo',
  })
  @Post('personal/doctor/list')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_READ)
  async getDoctorExaminationResults(
    @Request() req,
    @Body() bodyFilterExaminationResults: BodyFilterExaminationResultsDto,
  ) {
    const { userId } = req.user;
    return this.examinationResultService.findExaminationResultsByDoctorUserId(
      userId,
      bodyFilterExaminationResults,
    );
  }
}
