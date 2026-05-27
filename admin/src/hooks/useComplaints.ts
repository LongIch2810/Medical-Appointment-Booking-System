import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createComplaint,
  deleteComplaint,
  fetchComplaintDetail,
  fetchComplaints,
  updateComplaint,
} from "@/api/complaintApi";
import type {
  ComplaintListPayload,
  UpdateComplaintPayload,
} from "@/types/interface/complaint.interface";

export const complaintQueryKeys = {
  list: (filters: ComplaintListPayload) => ["complaints", filters] as const,
  detail: (complaintId: number) =>
    ["complaint-detail", complaintId] as const,
};

export function useComplaints(filters: ComplaintListPayload) {
  return useQuery({
    queryKey: complaintQueryKeys.list(filters),
    queryFn: () => fetchComplaints(filters),
  });
}

export function useComplaintDetail(complaintId: number) {
  return useQuery({
    queryKey: complaintQueryKeys.detail(complaintId),
    queryFn: () => fetchComplaintDetail(complaintId),
    enabled: complaintId > 0,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      toast.success("Gửi khiếu nại thành công");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => {
      toast.error("Gửi khiếu nại thất bại");
    },
  });
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      complaintId,
      payload,
    }: {
      complaintId: number;
      payload: UpdateComplaintPayload;
    }) => updateComplaint(complaintId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật khiếu nại thành công");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({
        queryKey: complaintQueryKeys.detail(variables.complaintId),
      });
    },
    onError: () => {
      toast.error("Cập nhật khiếu nại thất bại");
    },
  });
}

export function useDeleteComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComplaint,
    onSuccess: () => {
      toast.success("Xóa khiếu nại thành công");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => {
      toast.error("Xóa khiếu nại thất bại");
    },
  });
}
