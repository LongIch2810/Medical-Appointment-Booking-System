import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AuditLogListPayload,
  AuditLogListResponse,
} from "@/types/interface/auditLog.interface";

export const fetchAuditLogs = async (data: AuditLogListPayload) => {
  const res = await axiosInstance.post<ApiResponse<AuditLogListResponse>>(
    "/audit-logs",
    data,
  );
  return res.data;
};
