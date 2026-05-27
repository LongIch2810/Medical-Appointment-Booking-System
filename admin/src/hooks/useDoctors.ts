import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createDoctor,
  deleteDoctor,
  fetchDoctorDetail,
  fetchDoctors,
  fetchOutstandingDoctors,
  updateDoctor,
} from "@/api/doctorApi";
import type {
  DoctorListPayload,
  UpdateDoctorPayload,
} from "@/types/interface/doctor.interface";

export const doctorQueryKeys = {
  list: (filters: DoctorListPayload) => ["doctors", filters] as const,
  outstanding: ["doctors-outstanding"] as const,
  detail: (doctorId: number) => ["doctor-detail", doctorId] as const,
};

export function useDoctors(filters: DoctorListPayload) {
  return useQuery({
    queryKey: doctorQueryKeys.list(filters),
    queryFn: () => fetchDoctors(filters),
  });
}

export function useOutstandingDoctors() {
  return useQuery({
    queryKey: doctorQueryKeys.outstanding,
    queryFn: fetchOutstandingDoctors,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDoctorDetail(doctorId: number) {
  return useQuery({
    queryKey: doctorQueryKeys.detail(doctorId),
    queryFn: () => fetchDoctorDetail(doctorId),
    enabled: doctorId > 0,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDoctor,
    onSuccess: () => {
      toast.success("Tạo bác sĩ thành công");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: () => {
      toast.error("Tạo bác sĩ thất bại");
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorId,
      payload,
    }: {
      doctorId: number;
      payload: UpdateDoctorPayload;
    }) => updateDoctor(doctorId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật bác sĩ thành công");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({
        queryKey: doctorQueryKeys.detail(variables.doctorId),
      });
    },
    onError: () => {
      toast.error("Cập nhật bác sĩ thất bại");
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDoctor,
    onSuccess: () => {
      toast.success("Xóa bác sĩ thành công");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: () => {
      toast.error("Xóa bác sĩ thất bại");
    },
  });
}
