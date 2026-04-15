import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthProfileService } from '../health-profile/health-profile.service';
import { UsersService } from '../users/users.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { RelativesService } from '../relatives/relatives.service';
import { ExaminationResultService } from '../examination-result/examination-result.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly healthProfileService: HealthProfileService,
    private readonly appointmentsService: AppointmentsService,
    private readonly examinationResultService: ExaminationResultService,
    private readonly relativesService: RelativesService,
  ) {}

  async getPatientDashboard(userId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const healthProfilesCount =
      await this.healthProfileService.numberOfHealthProfilesByUserId(userId);
    const upcomingAppointmentsCount =
      await this.appointmentsService.numberOfUpcomingAppointmentsByUserId(
        userId,
      );
    const relativesCount =
      await this.relativesService.numberOfRelativesByUserId(userId);
    const examinationResultsCount =
      await this.examinationResultService.numberOfExaminationResultsByUserId(
        userId,
      );
    const personalHealthProfile =
      await this.healthProfileService.getPersonalHealthProfile(userId);
    return {
      healthProfilesCount,
      upcomingAppointmentsCount,
      relativesCount,
      examinationResultsCount,
      personalHealthProfile,
    };
  }
}
