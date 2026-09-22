import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AdminReport,
  AdminReportHistoryResponse,
  GenerateAdminReportPayload,
  AssistantTurnResponse,
  ReportAssistantConversationDetailResponse,
  ReportAssistantConversationListResponse,
} from "@/types/interface/adminReport.interface";

export const generateAdminReport = async (
  payload: GenerateAdminReportPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<AdminReport>>(
    "/admin-reports/generate",
    payload,
  );
  return res.data;
};

export async function getAdminReportHistory(page = 1, limit = 10, reportType?: string) {
  const res = await axiosInstance.get<ApiResponse<AdminReportHistoryResponse>>(
    "/admin-reports/history",
    { params: { page, limit, reportType: reportType || undefined } },
  );
  return res.data;
}

export async function deleteAdminReport(id: number) {
  const res = await axiosInstance.delete<ApiResponse<{ success: boolean }>>(`/admin-reports/history/${id}`);
  return res.data;
}

export async function createReportAssistantConversation(message: string) {
  const res = await axiosInstance.post<ApiResponse<AssistantTurnResponse>>(
    "/admin-reports/assistant/conversations",
    { message },
  );
  return res.data;
}

export async function getReportAssistantConversations(page = 1, limit = 20) {
  const res = await axiosInstance.get<
    ApiResponse<ReportAssistantConversationListResponse>
  >("/admin-reports/assistant/conversations", { params: { page, limit } });
  return res.data;
}

export async function getReportAssistantConversation(
  id: number,
  beforeMessageId?: number,
  limit = 50,
) {
  const res = await axiosInstance.get<
    ApiResponse<ReportAssistantConversationDetailResponse>
  >(`/admin-reports/assistant/conversations/${id}`, {
    params: { beforeMessageId, limit },
  });
  return res.data;
}

export async function sendReportAssistantMessage(
  id: number,
  message: string,
) {
  const res = await axiosInstance.post<ApiResponse<AssistantTurnResponse>>(
    `/admin-reports/assistant/conversations/${id}/messages`,
    { message },
  );
  return res.data;
}

export async function confirmReportAssistantPlan(
  id: number,
  confirmPlanMessageId: number,
) {
  const res = await axiosInstance.post<ApiResponse<AssistantTurnResponse>>(
    `/admin-reports/assistant/conversations/${id}/messages`,
    { confirmPlanMessageId },
  );
  return res.data;
}
