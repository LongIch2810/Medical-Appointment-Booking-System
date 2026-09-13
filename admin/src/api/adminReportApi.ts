import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AdminReport,
  AdminReportHistoryResponse,
  GenerateAdminReportPayload,
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
