import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';

export class BodyPersonalAppointmentsDto extends PaginationDto {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  appointmentStatus?: AppointmentStatus;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  relativeId?: number;

  @IsOptional()
  @IsDateString()
  appointmentDate?: string;
}
