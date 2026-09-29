import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  deleteAdminReport,
  getAdminReportDetail,
  getAdminReportHistory,
} from "@/api/adminReportApi";
import type { AdminReportHistoryParams } from "@/types/interface/adminReport.interface";
import type { ApiError } from "@/types/interface/apiError.interface";

export const adminReportQueryKeys = {
  all: ["admin-reports"] as const,
  history: (params?: AdminReportHistoryParams) =>
    [...adminReportQueryKeys.all, "history", params] as const,
  detail: (id: number) =>
    [...adminReportQueryKeys.all, "detail", id] as const,
};

export function useAdminReportHistory(params?: AdminReportHistoryParams) {
  return useQuery({
    queryKey: adminReportQueryKeys.history(params),
    queryFn: () => getAdminReportHistory(params),
    staleTime: 1000 * 30,
  });
}

export function useAdminReportDetail(id: number | null) {
  return useQuery({
    queryKey: adminReportQueryKeys.detail(id ?? 0),
    queryFn: () => getAdminReportDetail(id!),
    enabled: typeof id === "number" && id > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteAdminReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminReport(id),
    onSuccess: () => {
      toast.success("Xóa báo cáo thành công");
      queryClient.invalidateQueries({ queryKey: adminReportQueryKeys.all });
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiError>;
      const details = axiosError.response?.data?.error?.details;
      const message = Array.isArray(details)
        ? details[0]
        : details || "Không thể xóa báo cáo. Vui lòng thử lại.";
      toast.error(message);
    },
  });
}
