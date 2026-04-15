import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class BodyPersonalAppointmentsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  appointmentStatus?: string;
}
