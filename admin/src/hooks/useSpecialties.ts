import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createSpecialty,
  deleteSpecialty,
  fetchSpecialties,
  fetchSpecialtyDetail,
  updateSpecialty,
} from "@/api/specialtyApi";
import type {
  SpecialtyListPayload,
  UpdateSpecialtyPayload,
} from "@/types/interface/specialty.interface";

export const specialtyQueryKeys = {
  list: (filters: SpecialtyListPayload) => ["specialties", filters] as const,
  detail: (specialtyId: number) =>
    ["specialty-detail", specialtyId] as const,
};

export function useSpecialties(filters: SpecialtyListPayload) {
  return useQuery({
    queryKey: specialtyQueryKeys.list(filters),
    queryFn: () => fetchSpecialties(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSpecialtyDetail(specialtyId: number) {
  return useQuery({
    queryKey: specialtyQueryKeys.detail(specialtyId),
    queryFn: () => fetchSpecialtyDetail(specialtyId),
    enabled: specialtyId > 0,
  });
}

export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpecialty,
    onSuccess: () => {
      toast.success("Tạo chuyên khoa thành công");
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: () => {
      toast.error("Tạo chuyên khoa thất bại");
    },
  });
}

export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      specialtyId,
      payload,
    }: {
      specialtyId: number;
      payload: UpdateSpecialtyPayload;
    }) => updateSpecialty(specialtyId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật chuyên khoa thành công");
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      queryClient.invalidateQueries({
        queryKey: specialtyQueryKeys.detail(variables.specialtyId),
      });
    },
    onError: () => {
      toast.error("Cập nhật chuyên khoa thất bại");
    },
  });
}

export function useDeleteSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpecialty,
    onSuccess: () => {
      toast.success("Xóa chuyên khoa thành công");
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: () => {
      toast.error("Xóa chuyên khoa thất bại");
    },
  });
}
