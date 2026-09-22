export type PatientChatAction =
  | "ANSWER"
  | "CLARIFY"
  | "BOOKING_APPROVAL"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "MEMORY_RESULT"
  | "REFUSE";

export interface PatientChatConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientChatMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  action: PatientChatAction | null;
  content: string;
  payload: Record<string, unknown> | null;
  appointmentId: number | null;
  turnId: string | null;
  createdAt: string;
}

export interface PatientChatConversationPage {
  conversations: PatientChatConversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatientChatConversationDetail {
  conversation: PatientChatConversation;
  messages: PatientChatMessage[];
  hasMore: boolean;
  nextBeforeMessageId: number | null;
}

export interface PatientChatTurnResponse {
  conversation: PatientChatConversation;
  userMessage: PatientChatMessage | null;
  assistantMessage: PatientChatMessage;
  appointment: Record<string, unknown> | null;
}

