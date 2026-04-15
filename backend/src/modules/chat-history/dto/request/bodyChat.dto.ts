import { IsNotEmpty, IsString } from 'class-validator';

export class BodyChatDto {
  @IsString()
  @IsNotEmpty()
  question!: string;
}
