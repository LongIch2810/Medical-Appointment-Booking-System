import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { BodyCreateScheduleDto } from './dto/request/bodyCreateSchedule.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('doctor-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Post('personal-schedules')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_READ)
  async getPersonalSchedules(@Request() req) {
    const { userId } = req.user;
    return this.doctorSchedulesService.getPersonalSchedules(userId);
  }

  @Post('create-schedule')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'doctor-schedules' })
  async createSchedule(
    @Request() req,
    @Body() bodyCreateSchedule: BodyCreateScheduleDto,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.create(userId, bodyCreateSchedule);
  }

  @Get(':doctorId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_READ)
  async getDoctorSchedules(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.doctorSchedulesService.getSchedulesByDoctorId(doctorId);
  }

  @Patch(':doctorScheduleId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_UPDATE)
  @AuditLogAction({ action: 'UPDATE', entityName: 'doctor-schedules' })
  async updateSchedule(
    @Request() req,
    @Param('doctorScheduleId', ParseIntPipe) doctorScheduleId: number,
    @Body() bodyUpdateSchedule: BodyCreateScheduleDto,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.update(
      userId,
      doctorScheduleId,
      bodyUpdateSchedule,
    );
  }

  @Patch(':doctorScheduleId/status')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_UPDATE_STATUS)
  @AuditLogAction({ action: 'UPDATE', entityName: 'doctor-schedules.status' })
  async updateScheduleStatus(
    @Request() req,
    @Param('doctorScheduleId', ParseIntPipe) doctorScheduleId: number,
    @Body('is_active', ParseBoolPipe) isActive: boolean,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.updateActive(
      userId,
      doctorScheduleId,
      isActive,
    );
  }

  @Delete(':doctorScheduleId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE_DELETE)
  @AuditLogAction({ action: 'DELETE', entityName: 'doctor-schedules' })
  async deleteSchedule(
    @Request() req,
    @Param('doctorScheduleId', ParseIntPipe) doctorScheduleId: number,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.remove(userId, doctorScheduleId);
  }
}
