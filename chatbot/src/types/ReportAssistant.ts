import { z } from 'zod';

export const REPORT_ASSISTANT_ACTIONS = [
  'CLARIFY',
  'ANSWER',
  'PROPOSE_PLAN',
  'GENERATE_REPORT',
  'REFUSE',
] as const;

export const REPORT_ASSISTANT_VIEWS = [
  'chatbot_report_users_view',
  'chatbot_report_health_profiles_view',
  'chatbot_report_health_roadmaps_view',
  'chatbot_report_audit_view',
  'chatbot_report_appointments_view',
  'chatbot_report_doctor_schedules_view',
  'chatbot_report_doctors_view',
  'chatbot_report_specialties_view',
] as const;

export const REPORT_RANGE_PRESETS = [
  'TODAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'THIS_YEAR',
] as const;
export const REPORT_COMPARISONS = ['NONE', 'PREVIOUS_PERIOD', 'PREVIOUS_YEAR'] as const;
export const REPORT_CHART_TYPES = ['AUTO', 'BAR', 'LINE', 'PIE', 'TABLE'] as const;
export const REPORT_DETAIL_LEVELS = ['BRIEF', 'STANDARD', 'DETAILED'] as const;

// These are aggregate/result fields and dimensions exposed by the approved
// report views. User text is never persisted as a metric, dimension or SQL.
export const REPORT_PREFERENCE_METRICS = [
  'user_count',
  'profile_count',
  'roadmap_count',
  'event_count',
  'actor_count',
  'appointment_count',
  'average_age',
  'average_height',
  'average_weight',
] as const;
export const REPORT_PREFERENCE_GROUPS = [
  'registration_date',
  'gender',
  'age_group',
  'region',
  'roles',
  'profile_date',
  'health_goal',
  'roadmap_date',
  'activity_date',
  'action',
  'entity_name',
  'is_success',
  'appointment_date',
  'status',
  'booking_mode',
  'start_time',
  'day_of_week',
  'specialty_name',
] as const;

export const ReportAssistantPreferencesSchema = z.object({
  version: z.literal(1),
  defaultRangePreset: z.enum(REPORT_RANGE_PRESETS).nullable(),
  defaultComparison: z.enum(REPORT_COMPARISONS),
  preferredMetrics: z.array(z.enum(REPORT_PREFERENCE_METRICS)).max(10),
  preferredGroupBy: z.array(z.enum(REPORT_PREFERENCE_GROUPS)).max(10),
  preferredChartType: z.enum(REPORT_CHART_TYPES),
  detailLevel: z.enum(REPORT_DETAIL_LEVELS),
  updatedAt: z.string().datetime(),
});

export type ReportAssistantPreferences = z.infer<typeof ReportAssistantPreferencesSchema>;

export const AppliedReportPreferencesSchema = z.object({
  rangePreset: z.enum(REPORT_RANGE_PRESETS).optional(),
  comparison: z.enum(REPORT_COMPARISONS).optional(),
  metrics: z.array(z.enum(REPORT_PREFERENCE_METRICS)).max(10).optional(),
  groupBy: z.array(z.enum(REPORT_PREFERENCE_GROUPS)).max(10).optional(),
  chartType: z.enum(REPORT_CHART_TYPES).optional(),
  detailLevel: z.enum(REPORT_DETAIL_LEVELS).optional(),
});

export const ReportPlanSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(1).max(160),
  objective: z.string().min(1).max(500),
  query: z.string().min(5).max(2000),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comparisonFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  comparisonToDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  metrics: z.array(z.string().min(1).max(100)).max(20),
  groupBy: z.array(z.string().min(1).max(100)).max(20),
  sourceViews: z.array(z.enum(REPORT_ASSISTANT_VIEWS)).min(1).max(8),
  chartType: z.enum(REPORT_CHART_TYPES).optional(),
  detailLevel: z.enum(REPORT_DETAIL_LEVELS).optional(),
  appliedPreferences: AppliedReportPreferencesSchema.optional(),
});

export const ReportAssistantIntentSchema = z.object({
  action: z.enum(['CLARIFY', 'ANSWER', 'PROPOSE_PLAN', 'REFUSE', 'GENERATE_REPORT']),
  message: z.string().min(1).max(4000),
  plan: ReportPlanSchema.nullable().optional(),
});

export type ReportAssistantAction = (typeof REPORT_ASSISTANT_ACTIONS)[number];
export type ReportPlan = z.infer<typeof ReportPlanSchema>;
export type ReportAssistantHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
  action?: ReportAssistantAction;
  plan?: ReportPlan;
};

export type ReportAssistantInput = {
  userId: number;
  conversationId: number;
  turnId: number;
  threadId: string;
  mode: 'MESSAGE' | 'CONFIRM_PLAN';
  message: string;
  historySeed?: ReportAssistantHistoryItem[];
  confirmedPlan?: ReportPlan;
  fileName?: string;
};

export type ReportAssistantResponse = {
  action: ReportAssistantAction;
  message: string;
  plan?: ReportPlan;
  report?: {
    asset?: Record<string, unknown>;
    raw?: Record<string, unknown>;
  };
};
