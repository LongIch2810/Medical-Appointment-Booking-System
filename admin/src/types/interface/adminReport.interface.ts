export type AdminReportType =
  | "NEW_USER_REGISTRATIONS"
  | "AI_COACH_ACTIVITY"
  | "HEALTH_TRENDS"
  | "BOOKING_CANCELLATION_NOSHOW"
  | "PATIENT_FLOW_BY_TIMESLOT"
  | "APPOINTMENTS_BY_SPECIALTY"
  | "DOCTOR_FILL_RATE"
  | "USER_DEMOGRAPHICS"
  | "CONVERSATIONAL";

export type ReportAssistantAction =
  | "CLARIFY"
  | "ANSWER"
  | "PROPOSE_PLAN"
  | "GENERATE_REPORT"
  | "REFUSE";

export type ReportAssistantPlan = {
  schemaVersion: 1;
  title: string;
  objective: string;
  query: string;
  fromDate: string;
  toDate: string;
  comparisonFromDate?: string | null;
  comparisonToDate?: string | null;
  metrics: string[];
  groupBy: string[];
  sourceViews: string[];
  chartType?: "AUTO" | "BAR" | "LINE" | "PIE" | "TABLE";
  detailLevel?: "BRIEF" | "STANDARD" | "DETAILED";
  appliedPreferences?: {
    rangePreset?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR";
    comparison?: "NONE" | "PREVIOUS_PERIOD" | "PREVIOUS_YEAR";
    metrics?: string[];
    groupBy?: string[];
    chartType?: "AUTO" | "BAR" | "LINE" | "PIE" | "TABLE";
    detailLevel?: "BRIEF" | "STANDARD" | "DETAILED";
  };
};

export type ReportAssistantMessage = {
  id: number;
  role: "USER" | "ASSISTANT";
  action: ReportAssistantAction | null;
  content: string;
  plan: ReportAssistantPlan | null;
  report: AdminReport | null;
  createdAt: string;
};

export type ReportAssistantConversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantTurnResponse = {
  conversation: ReportAssistantConversation;
  userMessage: ReportAssistantMessage;
  assistantMessage: ReportAssistantMessage;
  report: AdminReport | null;
};

export type ReportAssistantConversationListResponse = {
  conversations: ReportAssistantConversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ReportAssistantConversationDetailResponse = {
  conversation: ReportAssistantConversation;
  messages: ReportAssistantMessage[];
  nextBeforeMessageId: number | null;
};

export type AdminReportAnalysisItem = {
  section_title: string;
  content: string;
};

export type AdminReportContent = {
  title: string;
  analysis: AdminReportAnalysisItem[];
  insights: string[];
  strategic_recommendations: string[];
  economic_context: string;
  footer: string;
};

export type AdminReportTableColumn = {
  key: string;
  label: string;
};

export type AdminReport = {
  id: number;
  createdAt: string;
  createdBy?: { id: number; fullname: string | null };
  reportType: AdminReportType;
  rangeLabel: string;
  sourceRequest?: string | null;
  executedQuery?: string | null;
  hasExecutedQuery?: boolean;
  pdfUrl: string | null;
  fileName?: string | null;
  report: AdminReportContent | null;
  // Cấu hình Chart.js do AI sinh ra (type/data/options) — không định kiểu chặt
  // vì AI tự quyết định cấu trúc chi tiết, chỉ ChartConfigRenderer đọc field
  // "type" để chọn component react-chartjs-2 phù hợp.
  chartConfig: Record<string, unknown> | null;
  tableColumns: AdminReportTableColumn[];
  tableRows: Record<string, string | number>[];
};
