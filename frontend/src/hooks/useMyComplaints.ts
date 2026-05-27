import { fetchMyComplaints } from "@/api/complaintApi";
import type { MyComplaintsPayload } from "@/api/complaintApi";
import { useQuery } from "@tanstack/react-query";

export const myComplaintQueryKeys = {
  list: (filters: MyComplaintsPayload) => ["my-complaints", filters] as const,
};

export function useMyComplaints(filters: MyComplaintsPayload) {
  return useQuery({
    queryKey: myComplaintQueryKeys.list(filters),
    queryFn: () => fetchMyComplaints(filters),
  });
}
