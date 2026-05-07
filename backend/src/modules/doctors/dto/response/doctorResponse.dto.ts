import { Exclude, Expose, Transform, Type } from "class-transformer";
import { DoctorScheduleResponseDto } from "src/modules/doctor-schedules/dto/response/doctorScheduleResponse.dto";
import { SpecialtyResponseDto } from "src/modules/specialties/dto/response/specialtyResponse.dto";
import { DayOfWeek } from "src/shared/enums/dayOfWeek";
import { DoctorLevel } from "src/shared/enums/doctorLevel";
import { formatDateDDMMYYYY } from "src/utils/formatDate";
import { groupSchedulesByDay } from "src/utils/groupSchedulesByDay";

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
    @Transform(({ value }) => Number(value ?? 0))
    avg_rating: number

    @Expose()
    @Transform(({ value }) => Number(value ?? 0))
    appointments_completed: number

    @Expose()
    isOutstanding: boolean

    @Expose()
    @Type(() => SpecialtyResponseDto)
    specialty!: SpecialtyResponseDto;

    @Expose()
    @Transform(({ value }) => groupSchedulesByDay(value))
    doctor_schedules!: Record<DayOfWeek, { start_time: string, end_time: string, is_active: boolean }>;

    @Expose()
    @Transform(({ value }) => formatDateDDMMYYYY(value))
    created_at!: string;

    @Expose()
    @Transform(({ value }) => formatDateDDMMYYYY(value))
    updated_at!: string;
}