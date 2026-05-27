import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import {
  cancelAppointment,
  createAppointment,
  fetchAdminAppointments,
  fetchAppointmentDetail,
  fetchDoctorAppointments,
  fetchPersonalAppointments,
  updateAppointmentStatus,
} from "@/api/appointmentApi";
import type { ApiError } from "@/types/interface/apiError.interface";
import type {
  AdminAppointmentListPayload,
  AppointmentListPayload,
  UpdateAppointmentStatusPayload,
} from "@/types/interface/appointment.interface";
import type { AppointmentStatus } from "@/types/interface/api.interface";

const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã khám xong",
  CANCELLED: "Đã hủy",
  ABSENT: "Vắng mặt",
};

function readApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiError>;
  const details = axiosError?.response?.data?.error?.details;
  if (Array.isArray(details)) return details[0] ?? fallback;
  if (typeof details === "string" && details.trim().length > 0) return details;
  return fallback;
}

export const appointmentQueryKeys = {
  admin: (filters: AdminAppointmentListPayload) =>
    ["appointments", "admin", filters] as const,
  doctor: (filters: AdminAppointmentListPayload) =>
    ["appointments", "doctor", filters] as const,
  personal: (filters: AppointmentListPayload) =>
    ["appointments", "personal", filters] as const,
  detail: (appointmentId: number) =>
    ["appointment-detail", appointmentId] as const,
};

export function useAdminAppointments(
  filters: AdminAppointmentListPayload,
  enabled = true,
) {
  return useQuery({
    queryKey: appointmentQueryKeys.admin(filters),
    queryFn: () => fetchAdminAppointments(filters),
    enabled,
  });
}

export function useDoctorAppointments(
  filters: AdminAppointmentListPayload,
  enabled = true,
) {
  return useQuery({
    queryKey: appointmentQueryKeys.doctor(filters),
    queryFn: () => fetchDoctorAppointments(filters),
    enabled,
  });
}

export function usePersonalAppointments(filters: AppointmentListPayload) {
  return useQuery({
    queryKey: appointmentQueryKeys.personal(filters),
    queryFn: () => fetchPersonalAppointments(filters),
  });
}

export function useAppointmentDetail(appointmentId: number) {
  return useQuery({
    queryKey: appointmentQueryKeys.detail(appointmentId),
    queryFn: () => fetchAppointmentDetail(appointmentId),
    enabled: appointmentId > 0,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      toast.success("Đặt lịch thành công");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => {
      toast.error("Đặt lịch thất bại");
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (_, appointmentId) => {
      toast.success("Hủy lịch thành công");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.detail(appointmentId),
      });
    },
    onError: () => {
      toast.error("Hủy lịch thất bại");
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      payload,
    }: {
      appointmentId: number;
      payload: UpdateAppointmentStatusPayload;
    }) => updateAppointmentStatus(appointmentId, payload),
    onSuccess: (_, variables) => {
      const statusLabel =
        APPOINTMENT_STATUS_LABEL[variables.payload.status] ??
        variables.payload.status;
      const successMessage =
        variables.payload.status === "COMPLETED"
          ? `Đã đánh dấu lịch hẹn #${variables.appointmentId} là "${statusLabel}".`
          : `Đã cập nhật lịch hẹn #${variables.appointmentId} sang trạng thái "${statusLabel}".`;
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: appointmentQueryKeys.detail(variables.appointmentId),
      });
    },
    onError: (error, variables) => {
      const statusLabel =
        APPOINTMENT_STATUS_LABEL[variables.payload.status] ??
        variables.payload.status;
      const fallback =
        variables.payload.status === "COMPLETED"
          ? `Lịch hẹn chưa được khám xong`
          : `Cập nhật lịch hẹn #${variables.appointmentId} sang "${statusLabel}" thất bại.`;
      toast.error(readApiErrorMessage(error, fallback));
    },
  });
}
