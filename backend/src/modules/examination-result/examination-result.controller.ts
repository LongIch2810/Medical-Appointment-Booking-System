import {
  Body,
  Controller,
  Get,
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

@Controller('examination-result')
@UseGuards(JwtAuthGuard)
export class ExaminationResultController {
  constructor(
    private readonly examinationResultService: ExaminationResultService,
  ) {}

  @Post()
  async getExaminationResults(
    @Body() bodyFilterExaminationResults: BodyFilterExaminationResultsDto,
  ) {
    return this.examinationResultService.filterAndPagination(
      bodyFilterExaminationResults,
    );
  }

  @Post('create')
  async createExaminationResult(
    @Body() bodyCreateExaminationResult: BodyCreateExaminationResultDto,
  ) {
    return this.examinationResultService.create(bodyCreateExaminationResult);
  }

  @Post('personal-results')
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
  async getExaminationResultDetail(
    @Param('resultId', ParseIntPipe) resultId: number,
  ) {
    return this.examinationResultService.findExaminationResultById(resultId);
  }

  @Patch(':resultId')
  async updateExaminationResult(
    @Param('resultId', ParseIntPipe) resultId: number,
    @Body() bodyUpdateExaminationResult: BodyUpdateExaminationResultDto,
  ) {
    return this.examinationResultService.update(
      resultId,
      bodyUpdateExaminationResult,
    );
  }
}
