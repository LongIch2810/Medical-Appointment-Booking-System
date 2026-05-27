import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthProfileService } from '../health-profile/health-profile.service';
import { UsersService } from '../users/users.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { RelativesService } from '../relatives/relatives.service';
import { ExaminationResultService } from '../examination-result/examination-result.service';
import { MessagesService } from '../messages/messages.service';
import { DashboardMapper } from './dashboard.mapper';
import { AdminDashboardResponseDto } from './dto/response/adminDashboardResponse.dto';
import { DoctorDashboardResponseDto } from './dto/response/doctorDashboardResponse.dto';
import { PatientDashboardResponseDto } from './dto/response/patientDashboardResponse.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly healthProfileService: HealthProfileService,
    private readonly appointmentsService: AppointmentsService,
    private readonly examinationResultService: ExaminationResultService,
    private readonly messagesService: MessagesService,
    private readonly relativesService: RelativesService,
  ) {}

  async getPatientDashboard(
    userId: number,
  ): Promise<PatientDashboardResponseDto> {
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
    return DashboardMapper.toPatientDashboardResponse({
      healthProfilesCount,
      upcomingAppointmentsCount,
      relativesCount,
      examinationResultsCount,
      personalHealthProfile,
    });
  }

  async getDoctorDashboard(
    userId: number,
    doctorId: number,
  ): Promise<DoctorDashboardResponseDto> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const totalAppointmentsToDayCount =
      await this.appointmentsService.numberOfAppointmentsToDayActiveByDoctorId(
        doctorId,
      );
    const upcomingAppointmentsCount =
      await this.appointmentsService.numberOfUpcomingAppointmentsByDoctorId(
        doctorId,
      );
    const totalMessagesUnreadInAllChannelsCount =
      await this.messagesService.numberOfMessagesUnreadInAllChannel(userId);

    const appointmentToDayEarly =
      await this.appointmentsService.getAppoitnmentToDayEarlyOfDoctor(
        userId,
        doctorId,
      );
    return DashboardMapper.toDoctorDashboardResponse({
      totalAppointmentsToDayCount,
      upcomingAppointmentsCount,
      totalMessagesUnreadInAllChannelsCount,
      appointmentToDayEarly,
    });
  }

  async getAdminDashboard(userId: number): Promise<AdminDashboardResponseDto> {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    const totalUsersCount = await this.usersService.numberOfUsersByAllRoles();
    const totalDoctorsActiveCount =
      await this.usersService.numberOfUsersByRoleDoctorActive();
    const totalPatientsActiveCount =
      await this.usersService.numberOfUsersByRolePatientActive();
    const totalAppointmentsToDayCount =
      await this.appointmentsService.numberOfAppointmentsToDayActive();
    const totalAppointmentsToDayCancelled =
      await this.appointmentsService.numberOfAppointmentsToDayCancelled();
    return DashboardMapper.toAdminDashboardResponse({
      totalUsersCount,
      totalDoctorsActiveCount,
      totalPatientsActiveCount,
      totalAppointmentsToDayCount,
      totalAppointmentsToDayCancelled,
    });
  }
}
