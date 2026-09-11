import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AdminReport,
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
