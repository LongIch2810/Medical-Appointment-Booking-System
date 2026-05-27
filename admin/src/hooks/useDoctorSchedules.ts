import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createDoctorSchedule,
  deleteDoctorSchedule,
  fetchDoctorSchedules,
  fetchPersonalSchedules,
  updateDoctorSchedule,
  updateDoctorScheduleStatus,
} from "@/api/doctorScheduleApi";
import type {
  CreateDoctorSchedulePayload,
  UpdateDoctorSchedulePayload,
} from "@/types/interface/doctorSchedule.interface";

export const doctorScheduleQueryKeys = {
  personal: ["doctor-schedules", "personal"] as const,
  byDoctor: (doctorId: number) =>
    ["doctor-schedules", "by-doctor", doctorId] as const,
};

export function usePersonalSchedules() {
  return useQuery({
    queryKey: doctorScheduleQueryKeys.personal,
    queryFn: fetchPersonalSchedules,
  });
}

export function useDoctorSchedulesByDoctorId(doctorId: number) {
  return useQuery({
    queryKey: doctorScheduleQueryKeys.byDoctor(doctorId),
    queryFn: () => fetchDoctorSchedules(doctorId),
    enabled: doctorId > 0,
  });
}

export function useCreateDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDoctorSchedulePayload) =>
      createDoctorSchedule(payload),
    onSuccess: () => {
      toast.success("Tạo lịch khám thành công");
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules"] });
    },
    onError: () => {
      toast.error("Tạo lịch khám thất bại");
    },
  });
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: number;
      payload: UpdateDoctorSchedulePayload;
    }) => updateDoctorSchedule(scheduleId, payload),
    onSuccess: () => {
      toast.success("Cập nhật lịch khám thành công");
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules"] });
    },
    onError: () => {
      toast.error("Cập nhật lịch khám thất bại");
    },
  });
}

export function useUpdateDoctorScheduleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      isActive,
    }: {
      scheduleId: number;
      isActive: boolean;
    }) => updateDoctorScheduleStatus(scheduleId, isActive),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái lịch khám thành công");
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules"] });
    },
    onError: () => {
      toast.error("Cập nhật trạng thái lịch khám thất bại");
    },
  });
}

export function useDeleteDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDoctorSchedule,
    onSuccess: () => {
      toast.success("Xóa lịch khám thành công");
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules"] });
    },
    onError: () => {
      toast.error("Xóa lịch khám thất bại");
    },
  });
}
