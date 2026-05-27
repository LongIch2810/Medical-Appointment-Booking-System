import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createExaminationResult,
  deleteExaminationResult,
  fetchDoctorExaminationResults,
  fetchExaminationResultDetail,
  fetchExaminationResults,
  fetchPersonalExaminationResults,
  updateExaminationResult,
} from "@/api/examinationResultApi";
import type {
  ExaminationResultListPayload,
  UpdateExaminationResultPayload,
} from "@/types/interface/examinationResult.interface";

export const examinationResultQueryKeys = {
  admin: (filters: ExaminationResultListPayload) =>
    ["examination-results", "admin", filters] as const,
  personal: (filters: ExaminationResultListPayload) =>
    ["examination-results", "personal", filters] as const,
  doctor: (filters: ExaminationResultListPayload) =>
    ["examination-results", "doctor", filters] as const,
  detail: (resultId: number) =>
    ["examination-result-detail", resultId] as const,
};

export function useExaminationResults(filters: ExaminationResultListPayload) {
  return useQuery({
    queryKey: examinationResultQueryKeys.admin(filters),
    queryFn: () => fetchExaminationResults(filters),
  });
}

export function usePersonalExaminationResults(
  filters: ExaminationResultListPayload,
) {
  return useQuery({
    queryKey: examinationResultQueryKeys.personal(filters),
    queryFn: () => fetchPersonalExaminationResults(filters),
  });
}

export function useDoctorExaminationResults(
  filters: ExaminationResultListPayload,
) {
  return useQuery({
    queryKey: examinationResultQueryKeys.doctor(filters),
    queryFn: () => fetchDoctorExaminationResults(filters),
  });
}

export function useExaminationResultDetail(resultId: number) {
  return useQuery({
    queryKey: examinationResultQueryKeys.detail(resultId),
    queryFn: () => fetchExaminationResultDetail(resultId),
    enabled: resultId > 0,
  });
}

export function useCreateExaminationResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExaminationResult,
    onSuccess: () => {
      toast.success("Tạo kết quả khám thành công");
      queryClient.invalidateQueries({ queryKey: ["examination-results"] });
    },
    onError: () => {
      toast.error("Tạo kết quả khám thất bại");
    },
  });
}

export function useUpdateExaminationResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resultId,
      payload,
    }: {
      resultId: number;
      payload: UpdateExaminationResultPayload;
    }) => updateExaminationResult(resultId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật kết quả khám thành công");
      queryClient.invalidateQueries({ queryKey: ["examination-results"] });
      queryClient.invalidateQueries({
        queryKey: examinationResultQueryKeys.detail(variables.resultId),
      });
    },
    onError: () => {
      toast.error("Cập nhật kết quả khám thất bại");
    },
  });
}

export function useDeleteExaminationResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExaminationResult,
    onSuccess: () => {
      toast.success("Xóa kết quả khám thành công");
      queryClient.invalidateQueries({ queryKey: ["examination-results"] });
    },
    onError: () => {
      toast.error("Xóa kết quả khám thất bại");
    },
  });
}
