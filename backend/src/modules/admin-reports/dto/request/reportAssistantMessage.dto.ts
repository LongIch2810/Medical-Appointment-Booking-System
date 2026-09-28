import { Allow, IsOptional, IsUUID } from 'class-validator';

export class ReportAssistantMessageDto {
  @Allow()
  message?: string;

  @Allow()
  confirmPlanMessageId?: number;

  @IsOptional()
  @IsUUID()
  turnId?: string;
}

export class CreateReportAssistantConversationDto {
  @Allow()
  message!: string;

  @IsOptional()
  @IsUUID()
  turnId?: string;
}
