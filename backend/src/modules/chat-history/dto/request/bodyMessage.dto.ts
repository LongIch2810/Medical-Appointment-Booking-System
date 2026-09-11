import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RoleMessage } from 'src/shared/enums/roleMessage';

export class BodyMessageDto {
  @IsEnum(RoleMessage)
  @IsNotEmpty()
  role!: RoleMessage;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
