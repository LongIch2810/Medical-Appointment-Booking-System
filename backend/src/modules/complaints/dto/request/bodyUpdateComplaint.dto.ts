import { IsIn, IsOptional, IsString } from 'class-validator';
import { ComplaintStatus } from 'src/entities/complaint.entity';

export class BodyUpdateComplaintDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(Object.values(ComplaintStatus))
  @IsOptional()
  status?: ComplaintStatus;

  @IsString()
  @IsOptional()
  response?: string;
}
