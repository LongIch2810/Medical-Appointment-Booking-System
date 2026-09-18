import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BodyPersonalAppointmentsDto } from './bodyPersonalAppointments.dto';
import { BookingMode } from 'src/shared/enums/bookingMode';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

export class BodyFilterImproveDto extends BodyPersonalAppointmentsDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  bookerId?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(BookingMode)
  @IsOptional()
  bookingMode?: BookingMode;

  @IsDateString()
  @IsOptional()
  @IsBeforeOrEqual('appointmentTo')
  appointmentFrom?: string;

  @IsDateString()
  @IsOptional()
  appointmentTo?: string;
}
