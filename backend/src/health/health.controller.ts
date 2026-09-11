import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getRoot() {
    return {
      success: true,
      service: 'medical-appointment-backend',
      message: 'Backend is running',
      health: '/healthy',
      apiBase: '/api/v1',
    };
  }

  @Get('healthy')
  getHealth() {
    return {
      status: 'ok',
      service: 'medical-appointment-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
