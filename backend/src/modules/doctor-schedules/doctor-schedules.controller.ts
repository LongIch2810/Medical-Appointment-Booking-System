import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller('doctor-schedules')
@UseGuards(JwtAuthGuard)
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Post('personal-schedules')
  async getPersonalSchedules(@Request() req) {
    const { userId } = req.user;
    return this.doctorSchedulesService.getPersonalSchedules(userId);
  }

  @Post('create-schedule')
  async createSchedule(
    @Request() req,
    @Body() bodyCreateSchedule: BodyCreateScheduleDto,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.create(userId, bodyCreateSchedule);
  }

  @Get(':doctorId')
  async getDoctorSchedules(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.doctorSchedulesService.getSchedulesByDoctorId(doctorId);
  }

  @Patch(':doctorScheduleId')
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
  async deleteSchedule(
    @Request() req,
    @Param('doctorScheduleId', ParseIntPipe) doctorScheduleId: number,
  ) {
    const { userId } = req.user;
    return this.doctorSchedulesService.remove(userId, doctorScheduleId);
  }
}
