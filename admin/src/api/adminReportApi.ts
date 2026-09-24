import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AssistantTurnResponse,
  ReportAssistantConversationDetailResponse,
  ReportAssistantConversationListResponse,
} from "@/types/interface/adminReport.interface";

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

export async function getAdminReportFileUrl(id: number, download = false) {
  const res = await axiosInstance.get<
    ApiResponse<{ url: string }>
  >(`/admin-reports/history/${id}/file-url`, { params: { download } });
  return res.data.data.url;
}

export async function revealAdminReportQuery(id: number, password: string) {
  const res = await axiosInstance.post<ApiResponse<{ executedQuery: string }>>(
    `/admin-reports/history/${id}/reveal-query`,
    { password },
  );
  return res.data.data.executedQuery;
}
