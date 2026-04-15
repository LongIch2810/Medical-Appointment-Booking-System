import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { BodyCreateAppointmentDto } from './dto/request/bodyCreateAppointment.dto';
import { BodyPersonalAppointmentsDto } from './dto/request/bodyPersonalAppointments.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('booking')
  async createAppointment(
    @Body() bodyCreateAppointment: BodyCreateAppointmentDto,
    @Request() req,
  ) {
    const { userId } = req.user;
    return this.appointmentsService.createWithRetry(
      userId,
      bodyCreateAppointment,
    );
  }

  @Delete('cancel/:id')
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
  async getAppointmentDetail(
    @Request() req,
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    const { userId } = req.user;
    const appointment = await this.appointmentsService.getAppointment(
      userId,
      appointmentId,
    );
    return appointment;
  }
}
