import { Exclude, Expose, Type } from 'class-transformer';
import { HealthProfileResponseDto } from 'src/modules/health-profile/dto/response/healthProfileResponse.dto';

@Exclude()
export class PatientDashboardResponseDto {
  @Expose()
  healthProfilesCount!: number;

  @Expose()
  upcomingAppointmentsCount!: number;

  @Expose()
  relativesCount!: number;

  @Expose()
  examinationResultsCount!: number;

  @Expose()
  @Type(() => HealthProfileResponseDto)
  personalHealthProfile!: HealthProfileResponseDto | null;
}
