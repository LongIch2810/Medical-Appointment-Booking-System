import {
  IsIn,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreatePatientChatConversationDto {
  @IsString()
  @MaxLength(4000)
  @ValidateIf((_object, value) => value !== undefined)
  message?: string;
}

export class SendPatientChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @ValidateIf((object) => object.approvalMessageId === undefined)
  message?: string;

  @IsInt()
  @Min(1)
  @ValidateIf((object) => object.message === undefined)
  approvalMessageId?: number;

  @IsIn(['APPROVE', 'CANCEL'])
  @ValidateIf((object) => object.approvalMessageId !== undefined)
  decision?: 'APPROVE' | 'CANCEL';
}
