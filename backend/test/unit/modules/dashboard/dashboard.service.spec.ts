import { NotFoundException } from '@nestjs/common';
import { DashboardService } from 'src/modules/dashboard/dashboard.service';
import { UsersService } from 'src/modules/users/users.service';
import { HealthProfileService } from 'src/modules/health-profile/health-profile.service';
import { AppointmentsService } from 'src/modules/appointments/appointments.service';
import { ExaminationResultService } from 'src/modules/examination-result/examination-result.service';
import { MessagesService } from 'src/modules/messages/messages.service';
import { RelativesService } from 'src/modules/relatives/relatives.service';
import { DoctorsService } from 'src/modules/doctors/doctors.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let usersService: {
    isUserExists: jest.Mock;
    numberOfUsersByAllRoles: jest.Mock;
    numberOfUsersByRoleDoctorActive: jest.Mock;
    numberOfUsersByRolePatientActive: jest.Mock;
  };
  let healthProfileService: {
    numberOfHealthProfilesByUserId: jest.Mock;
    getPersonalHealthProfile: jest.Mock;
  };
  let appointmentsService: {
    numberOfUpcomingAppointmentsByUserId: jest.Mock;
    numberOfAppointmentsToDayActiveByDoctorId: jest.Mock;
    numberOfUpcomingAppointmentsByDoctorId: jest.Mock;
    getAppoitnmentToDayEarlyOfDoctor: jest.Mock;
    numberOfAppointmentsToDayActive: jest.Mock;
    numberOfAppointmentsToDayCancelled: jest.Mock;
  };
  let examinationResultService: {
    numberOfExaminationResultsByUserId: jest.Mock;
  };
  let messagesService: { numberOfMessagesUnreadInAllChannel: jest.Mock };
  let relativesService: { numberOfRelativesByUserId: jest.Mock };
  let doctorsService: { findDoctorByUserId: jest.Mock };

  beforeEach(() => {
    usersService = {
      isUserExists: jest.fn().mockResolvedValue(true),
      numberOfUsersByAllRoles: jest.fn().mockResolvedValue(100),
      numberOfUsersByRoleDoctorActive: jest.fn().mockResolvedValue(10),
      numberOfUsersByRolePatientActive: jest.fn().mockResolvedValue(80),
    };
    healthProfileService = {
      numberOfHealthProfilesByUserId: jest.fn().mockResolvedValue(2),
      getPersonalHealthProfile: jest.fn().mockResolvedValue(null),
    };
    appointmentsService = {
      numberOfUpcomingAppointmentsByUserId: jest.fn().mockResolvedValue(3),
      numberOfAppointmentsToDayActiveByDoctorId: jest
        .fn()
        .mockResolvedValue(4),
      numberOfUpcomingAppointmentsByDoctorId: jest.fn().mockResolvedValue(5),
      getAppoitnmentToDayEarlyOfDoctor: jest.fn().mockResolvedValue(null),
      numberOfAppointmentsToDayActive: jest.fn().mockResolvedValue(6),
      numberOfAppointmentsToDayCancelled: jest.fn().mockResolvedValue(1),
    };
    examinationResultService = {
      numberOfExaminationResultsByUserId: jest.fn().mockResolvedValue(7),
    };
    messagesService = {
      numberOfMessagesUnreadInAllChannel: jest.fn().mockResolvedValue(8),
    };
    relativesService = {
      numberOfRelativesByUserId: jest.fn().mockResolvedValue(9),
    };
    doctorsService = {
      findDoctorByUserId: jest.fn().mockResolvedValue({ id: 20 }),
    };

    service = new DashboardService(
      usersService as unknown as UsersService,
      healthProfileService as unknown as HealthProfileService,
      appointmentsService as unknown as AppointmentsService,
      examinationResultService as unknown as ExaminationResultService,
      messagesService as unknown as MessagesService,
      relativesService as unknown as RelativesService,
      doctorsService as unknown as DoctorsService,
    );
  });

  describe('getPatientDashboard', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      usersService.isUserExists.mockResolvedValue(false);

      await expect(service.getPatientDashboard(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('aggregates counts and the personal health profile for the given user', async () => {
      const result = await service.getPatientDashboard(9);

      expect(usersService.isUserExists).toHaveBeenCalledWith(9);
      expect(
        healthProfileService.numberOfHealthProfilesByUserId,
      ).toHaveBeenCalledWith(9);
      expect(
        appointmentsService.numberOfUpcomingAppointmentsByUserId,
      ).toHaveBeenCalledWith(9);
      expect(
        relativesService.numberOfRelativesByUserId,
      ).toHaveBeenCalledWith(9);
      expect(
        examinationResultService.numberOfExaminationResultsByUserId,
      ).toHaveBeenCalledWith(9);
      expect(
        healthProfileService.getPersonalHealthProfile,
      ).toHaveBeenCalledWith(9);
      expect(result).toMatchObject({
        healthProfilesCount: 2,
        upcomingAppointmentsCount: 3,
        relativesCount: 9,
        examinationResultsCount: 7,
      });
    });
  });

  describe('getDoctorDashboard', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      usersService.isUserExists.mockResolvedValue(false);

      await expect(service.getDoctorDashboard(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when the user has no linked doctor profile', async () => {
      doctorsService.findDoctorByUserId.mockRejectedValue(
        new NotFoundException('Bác sĩ không tồn tại.'),
      );

      await expect(service.getDoctorDashboard(9)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('resolves doctorId from userId via DoctorsService and aggregates doctor-scoped stats', async () => {
      const result = await service.getDoctorDashboard(9);

      expect(usersService.isUserExists).toHaveBeenCalledWith(9);
      expect(doctorsService.findDoctorByUserId).toHaveBeenCalledWith(9);
      expect(
        appointmentsService.numberOfAppointmentsToDayActiveByDoctorId,
      ).toHaveBeenCalledWith(20);
      expect(
        appointmentsService.numberOfUpcomingAppointmentsByDoctorId,
      ).toHaveBeenCalledWith(20);
      expect(
        messagesService.numberOfMessagesUnreadInAllChannel,
      ).toHaveBeenCalledWith(9);
      expect(
        appointmentsService.getAppoitnmentToDayEarlyOfDoctor,
      ).toHaveBeenCalledWith(9, 20);
      expect(result).toMatchObject({
        totalAppointmentsToDayCount: 4,
        upcomingAppointmentsCount: 5,
        totalMessagesUnreadInAllChannelsCount: 8,
      });
    });
  });

  describe('getAdminDashboard', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      usersService.isUserExists.mockResolvedValue(false);

      await expect(service.getAdminDashboard(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('aggregates system-wide user and appointment counts', async () => {
      const result = await service.getAdminDashboard(9);

      expect(usersService.isUserExists).toHaveBeenCalledWith(9);
      expect(usersService.numberOfUsersByAllRoles).toHaveBeenCalled();
      expect(
        usersService.numberOfUsersByRoleDoctorActive,
      ).toHaveBeenCalled();
      expect(
        usersService.numberOfUsersByRolePatientActive,
      ).toHaveBeenCalled();
      expect(
        appointmentsService.numberOfAppointmentsToDayActive,
      ).toHaveBeenCalled();
      expect(
        appointmentsService.numberOfAppointmentsToDayCancelled,
      ).toHaveBeenCalled();
      expect(result).toMatchObject({
        totalUsersCount: 100,
        totalDoctorsActiveCount: 10,
        totalPatientsActiveCount: 80,
        totalAppointmentsToDayCount: 6,
        totalAppointmentsToDayCancelled: 1,
      });
    });
  });
});
