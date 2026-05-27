import { plainToInstance } from 'class-transformer';
import { AdminDashboardResponseDto } from './dto/response/adminDashboardResponse.dto';
import { DoctorDashboardResponseDto } from './dto/response/doctorDashboardResponse.dto';
import { PatientDashboardResponseDto } from './dto/response/patientDashboardResponse.dto';

export class DashboardMapper {
  static toAdminDashboardResponse(
    payload: Record<string, unknown>,
  ): AdminDashboardResponseDto {
    return plainToInstance(AdminDashboardResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }

  static toDoctorDashboardResponse(
    payload: Record<string, unknown>,
  ): DoctorDashboardResponseDto {
    return plainToInstance(DoctorDashboardResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }

  static toPatientDashboardResponse(
    payload: Record<string, unknown>,
  ): PatientDashboardResponseDto {
    return plainToInstance(PatientDashboardResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }
}
