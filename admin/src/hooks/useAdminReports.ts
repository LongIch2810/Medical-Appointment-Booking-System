import { useQuery } from "@tanstack/react-query";
import { getAdminReportDetail, getAdminReportHistory } from "@/api/adminReportApi";
import type { AdminReportHistoryParams } from "@/types/interface/adminReport.interface";

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
