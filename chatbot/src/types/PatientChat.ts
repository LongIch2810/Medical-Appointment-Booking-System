import { z } from 'zod';

export const PATIENT_CHAT_ACTIONS = [
  'ANSWER',
  'CLARIFY',
  'BOOKING_APPROVAL',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'MEMORY_RESULT',
  'REFUSE',
] as const;

export const PatientChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(12_000),
  action: z.enum(PATIENT_CHAT_ACTIONS).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const PatientChatHistorySchema = z.array(PatientChatHistoryItemSchema).max(12);

export const PatientPreferenceSchema = z.object({
  version: z.literal(1),
  language: z.enum(['vi', 'en']).nullable(),
  detailLevel: z.enum(['BRIEF', 'STANDARD', 'DETAILED']),
  preferredAppointmentDays: z.array(z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
  ])).max(7),
  preferredTimeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY']),
  updatedAt: z.string().datetime(),
});

export type PatientChatAction = (typeof PATIENT_CHAT_ACTIONS)[number];
export type PatientChatHistoryItem = z.infer<typeof PatientChatHistoryItemSchema>;
export type PatientPreference = z.infer<typeof PatientPreferenceSchema>;

export type PatientChatInput = {
  userId: number;
  conversationId: number;
  turnId: string;
  threadId: string;
  mode: 'MESSAGE' | 'RESUME_BOOKING';
  message?: string;
  decision?: 'APPROVE' | 'REVISE' | 'CANCEL';
  approvalMessageId?: number;
  operationId?: string;
  bookingSummary?: Record<string, unknown>;
  historySeed?: PatientChatHistoryItem[];
  token: string;
};

export type PatientChatResponse = {
  action: PatientChatAction;
  message: string;
  payload?: Record<string, unknown>;
  appointment?: Record<string, unknown> | null;
};
