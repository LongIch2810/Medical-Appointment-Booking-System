import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { SpecialtyResponseDto } from 'src/modules/specialties/dto/response/specialtyResponse.dto';
import { DayOfWeek } from 'src/shared/enums/dayOfWeek';
import { DoctorLevel } from 'src/shared/enums/doctorLevel';
import { formatDateDDMMYYYY } from 'src/utils/formatDate';
import {
  GroupedSchedule,
  groupSchedulesByDay,
} from 'src/utils/groupSchedulesByDay';
import DoctorSchedule from '../../../../entities/doctorSchedule.entity';

@Exclude()
export class DoctorResponseDto {
  @Expose()
  id!: number;

  @Expose()
  fullname!: string;

  @Expose()
  email!: string;

  @Expose()
  phone!: string | null;

  @Expose()
  gender!: boolean;

  @Expose()
  date_of_birth!: Date | null;

  @Expose()
  picture!: string | null;

  @Expose()
  address!: string | null;

  @Expose()
  experience!: number;

  @Expose()
  about_me!: string;

  @Expose()
  workplace!: string;

  @Expose()
  doctor_level!: DoctorLevel;

  @Expose()
  user_id!: number;

  @Expose()
  @Transform(({ value }) => Number(value ?? 0))
  avg_rating!: number;

  @Expose()
  @Transform(({ value }) => Number(value ?? 0))
  appointments_completed!: number;

  @Expose()
  isOutstanding!: boolean;

  @Expose()
  @Type(() => SpecialtyResponseDto)
  specialty!: SpecialtyResponseDto;

  @Expose()
  @Transform(({ obj }) => {
    const source = obj as { doctor_schedules?: DoctorSchedule[] };
    return groupSchedulesByDay(source.doctor_schedules ?? []);
  })
  doctor_schedules!: Record<DayOfWeek, GroupedSchedule[]>;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  created_at!: string;

  @Expose()
  @Transform(({ value }) => formatDateDDMMYYYY(value))
  updated_at!: string;
}
