import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AdminDashboardResponseDto {
  @Expose()
  totalUsersCount!: number;

  @Expose()
  totalDoctorsActiveCount!: number;

  @Expose()
  totalPatientsActiveCount!: number;

  @Expose()
  totalAppointmentsToDayCount!: number;

  @Expose()
  totalAppointmentsToDayCancelled!: number;
}
