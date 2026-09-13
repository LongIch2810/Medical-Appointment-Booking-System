export type AdminReportType =
  | "NEW_USER_REGISTRATIONS"
  | "HEALTH_GOAL_SUMMARY"
  | "AI_COACH_ACTIVITY"
  | "HEALTH_TRENDS"
  | "BOOKING_CANCELLATION_NOSHOW"
  | "PATIENT_FLOW_BY_TIMESLOT"
  | "APPOINTMENTS_BY_SPECIALTY"
  | "DOCTOR_FILL_RATE"
  | "USER_DEMOGRAPHICS";

export type AdminReportRangePreset =
  | "TODAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "CUSTOM";

export type GenerateAdminReportPayload = {
  reportType: AdminReportType;
  rangePreset: AdminReportRangePreset;
  fromDate?: string;
  toDate?: string;
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

export type AdminReportHistoryResponse = {
  reports: AdminReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
