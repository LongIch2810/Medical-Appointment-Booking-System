import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { HealthProfileModule } from '../health-profile/health-profile.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { RelativesModule } from '../relatives/relatives.module';
import { ExaminationResultModule } from '../examination-result/examination-result.module';

@Module({
  imports: [
    UsersModule,
    HealthProfileModule,
    AppointmentsModule,
    ExaminationResultModule,
    RelativesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
