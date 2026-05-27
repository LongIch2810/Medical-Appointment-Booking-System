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
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateAppointmentDto } from './dto/request/bodyCreateAppointment.dto';
import { BodyPersonalAppointmentsDto } from './dto/request/bodyPersonalAppointments.dto';
import { BodyFilterImproveDto } from './dto/request/bodyFilterImprove.dto';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { BodyUpdateAppointmentStatusDto } from './dto/request/bodyUpdateAppointmentStatus.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('booking')
  @HttpCode(HttpStatus.CREATED)
  @Permissions(PERMISSIONS.APPOINTMENT_CREATE)
  @AuditLogAction({ action: 'CREATE', entityName: 'appointments' })
  async createAppointment(
    @Body() bodyCreateAppointment: BodyCreateAppointmentDto,
    @Request() req,
  ) {
    const { userId } = req.user;
    return this.appointmentsService.createWithNotifications(
      userId,
      bodyCreateAppointment,
    );
  }

  @Delete('cancel/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_CANCEL)
  @AuditLogAction({ action: 'DELETE', entityName: 'appointments.cancel' })
  async cancelAppointment(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Req() req,
  ) {
    const { userId } = req.user;
    const cancelAppointments = await this.appointmentsService.cancel(
      userId,
      appointmentId,
    );
    return cancelAppointments;
  }

  @Post('personal-appointments')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  async getPersonalAppointments(
    @Request() req,
    @Body() objectFilters: BodyPersonalAppointmentsDto,
  ) {
    const { userId } = req.user;
    const personalAppointments =
      await this.appointmentsService.findPersonalAppointments(
        userId,
        objectFilters,
      );
    return personalAppointments;
  }

  @Get(':appointmentId')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  async getAppointmentDetail(
    @Request() req,
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    const { userId } = req.user;
    const appointment = await this.appointmentsService.getAppointmentDetail(
      userId,
      appointmentId,
    );
    return appointment;
  }

  @Post('admin/appointments')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_MANAGE)
  async filterAndPaginationOfAdmin(
    @Request() req,
    @Body() objectFilters: BodyFilterImproveDto,
  ) {
    const adminAppointments =
      await this.appointmentsService.filterAndPaginationOfAdmin(objectFilters);
    return adminAppointments;
  }

  @Post('doctor/appointments')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_MANAGE)
  async findAndPaginationOfDoctor(
    @Request() req,
    @Body() objectFilters: BodyFilterImproveDto,
  ) {
    const { userId } = req.user;
    const doctorAppointments =
      await this.appointmentsService.findAndPaginationOfDoctor(
        userId,
        objectFilters,
      );
    return doctorAppointments;
  }

  @Patch(':appointmentId/status')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE_STATUS)
  @AuditLogAction({ action: 'UPDATE', entityName: 'appointments.status' })
  async updateAppointmentStatus(
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
    @Body() body: BodyUpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(appointmentId, body.status);
  }
}
