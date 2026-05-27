import { useQuery } from "@tanstack/react-query";

import { fetchAuditLogs } from "@/api/auditLogApi";
import type { AuditLogListPayload } from "@/types/interface/auditLog.interface";

export const auditLogQueryKeys = {
  list: (filters: AuditLogListPayload) => ["audit-logs", filters] as const,
};

export function useAuditLogs(filters: AuditLogListPayload) {
  return useQuery({
    queryKey: auditLogQueryKeys.list(filters),
    queryFn: () => fetchAuditLogs(filters),
  });
}
