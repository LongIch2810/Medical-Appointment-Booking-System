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

@Controller('examination-result')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExaminationResultController {
  constructor(
    private readonly examinationResultService: ExaminationResultService,
  ) {}

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

  @Get(':resultId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.EXAMINATION_RESULT_READ)
  async getExaminationResultDetail(
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    return this.examinationResultService.getExaminationResultDetail(resultId);
  }

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
