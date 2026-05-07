import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { DoctorScheduleResponseDto } from './dto/response/doctorScheduleResponse.dto';
import { plainToInstance } from 'class-transformer';
import { groupSchedulesByDay } from 'src/utils/groupSchedulesByDay';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';

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
  ): Record<DayOfWeek, { start_time: string, end_time: string, is_active: boolean }[]> {
    return groupSchedulesByDay(doctorSchedules)
  }
}
