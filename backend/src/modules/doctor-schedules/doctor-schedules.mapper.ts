import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { DoctorScheduleResponseDto } from './dto/response/doctorScheduleResponse.dto';
import { plainToInstance } from 'class-transformer';

export class DoctorScheduleMapper {
  static toDoctorScheduleResponseDto(
    doctorSchedule: DoctorSchedule,
  ): DoctorScheduleResponseDto {
    return plainToInstance(DoctorScheduleResponseDto, doctorSchedule, {
      excludeExtraneousValues: true,
    });
  }

  static toDoctorScheduleResponseDtoList(
    doctorSchedules: DoctorSchedule[],
  ): DoctorScheduleResponseDto[] {
    return plainToInstance(DoctorScheduleResponseDto, doctorSchedules, {
      excludeExtraneousValues: true,
    });
  }
}
