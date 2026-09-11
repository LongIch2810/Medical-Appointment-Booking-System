import { useQuery } from "@tanstack/react-query";

import { mockApi, queryKeys } from "@/services/mockApi";

export function useEnterpriseReportGroups() {
  return useQuery({
    queryKey: queryKeys.enterpriseReports,
    queryFn: mockApi.getEnterpriseReportGroups,
  });
}
