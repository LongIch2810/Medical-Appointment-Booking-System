import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }
  @Get('/patient')
  async getPatientDashboard(@Req() req) {
    const { userId } = req.user;
    const dashboardPatientData =
      await this.dashboardService.getPatientDashboard(userId);
    return dashboardPatientData;
  }
}
