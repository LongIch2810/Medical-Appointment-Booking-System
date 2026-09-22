import { Allow } from 'class-validator';

export class ReportAssistantMessageDto {
  @Allow()
  message?: string;

  @Allow()
  confirmPlanMessageId?: number;
}

export class CreateReportAssistantConversationDto {
  @Allow()
  message!: string;
}
