import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { RoleMessage } from 'src/shared/enums/roleMessage';

export class BodyMessageDto {
  @IsNumber()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  role!: RoleMessage;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
