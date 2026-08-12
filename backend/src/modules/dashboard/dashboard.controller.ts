import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/utils/constants';
import { DashboardService } from './dashboard.service';
import { AdminDashboardResponseDto } from './dto/response/adminDashboardResponse.dto';
import { DoctorDashboardResponseDto } from './dto/response/doctorDashboardResponse.dto';
import { PatientDashboardResponseDto } from './dto/response/patientDashboardResponse.dto';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiCookieAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Thống kê dashboard bệnh nhân' })
  @Get('/patient')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DASHBOARD_PATIENT)
  async getPatientDashboard(@Req() req): Promise<PatientDashboardResponseDto> {
    const { userId } = req.user;
    return this.dashboardService.getPatientDashboard(userId);
  }

  @ApiOperation({ summary: 'Thống kê dashboard bác sĩ' })
  @Get('/doctor')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DASHBOARD_DOCTOR)
  async getDoctorDashboard(@Req() req): Promise<DoctorDashboardResponseDto> {
    const { userId } = req.user;
    const doctorId = req.user?.doctorId ?? req.user?.doctor?.id;
    return this.dashboardService.getDoctorDashboard(userId, doctorId);
  }

  @ApiOperation({ summary: 'Thống kê dashboard admin' })
  @Get('/admin')
  @HttpCode(HttpStatus.OK)
  @Permissions(PERMISSIONS.DASHBOARD_ADMIN)
  async getAdminDashboard(@Req() req): Promise<AdminDashboardResponseDto> {
    const { userId } = req.user;
    return this.dashboardService.getAdminDashboard(userId);
  }
}
