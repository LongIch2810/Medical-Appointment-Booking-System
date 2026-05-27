import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AdminAppointmentListPayload,
  Appointment,
  AppointmentParticipant,
  AppointmentListPayload,
  AppointmentListResponse,
  CreateAppointmentPayload,
  UpdateAppointmentStatusPayload,
} from "@/types/interface/appointment.interface";
import type { AppointmentStatus } from "@/types/interface/api.interface";

type RawAppointmentParticipant = AppointmentParticipant & {
  user?: AppointmentParticipant | null;
};

export type RawAppointment = Omit<Appointment, "appointment_status"> & {
  status?: AppointmentStatus;
  appointment_status?: AppointmentStatus;
  doctor_schedule?: {
    start_time?: string;
    end_time?: string;
  } | null;
  doctor?: RawAppointmentParticipant | null;
  booked_by_user?: AppointmentParticipant | null;
};

export function normalizeAppointment(appointment: RawAppointment): Appointment {
  const doctor = appointment.doctor
    ? {
        ...appointment.doctor,
        fullname:
          appointment.doctor.fullname ?? appointment.doctor.user?.fullname,
        picture: appointment.doctor.picture ?? appointment.doctor.user?.picture,
        phone: appointment.doctor.phone ?? appointment.doctor.user?.phone,
        email: appointment.doctor.email ?? appointment.doctor.user?.email,
      }
    : null;

  return {
    ...appointment,
    appointment_status:
      appointment.appointment_status ?? appointment.status ?? "PENDING",
    status: appointment.status ?? appointment.appointment_status,
    start_time: appointment.start_time ?? appointment.doctor_schedule?.start_time,
    end_time: appointment.end_time ?? appointment.doctor_schedule?.end_time,
    doctor,
    booker: appointment.booker ?? appointment.booked_by_user,
  };
}

function normalizeAppointmentListResponse(
  data: AppointmentListResponse,
): AppointmentListResponse {
  return {
    ...data,
    appointments: (data.appointments as RawAppointment[]).map(
      normalizeAppointment,
    ),
  };
}

export const fetchAdminAppointments = async (
  data: AdminAppointmentListPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<AppointmentListResponse>>(
    "/appointments/admin/appointments",
    data,
  );
  return {
    ...res.data,
    data: normalizeAppointmentListResponse(res.data.data),
  };
};

export const fetchDoctorAppointments = async (
  data: AdminAppointmentListPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<AppointmentListResponse>>(
    "/appointments/doctor/appointments",
    data,
  );
  return {
    ...res.data,
    data: normalizeAppointmentListResponse(res.data.data),
  };
};

export const fetchPersonalAppointments = async (
  data: AppointmentListPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<AppointmentListResponse>>(
    "/appointments/personal-appointments",
    data,
  );
  return {
    ...res.data,
    data: normalizeAppointmentListResponse(res.data.data),
  };
};

export const fetchAppointmentDetail = async (appointmentId: number) => {
  const res = await axiosInstance.get<ApiResponse<RawAppointment>>(
    `/appointments/${appointmentId}`,
  );
  return {
    ...res.data,
    data: normalizeAppointment(res.data.data),
  };
};

export const createAppointment = async (data: CreateAppointmentPayload) => {
  const res = await axiosInstance.post<ApiResponse<RawAppointment>>(
    "/appointments/booking",
    data,
  );
  return {
    ...res.data,
    data: normalizeAppointment(res.data.data),
  };
};

export const cancelAppointment = async (appointmentId: number) => {
  const res = await axiosInstance.delete<ApiResponse<RawAppointment>>(
    `/appointments/cancel/${appointmentId}`,
  );
  return {
    ...res.data,
    data: normalizeAppointment(res.data.data),
  };
};

export const updateAppointmentStatus = async (
  appointmentId: number,
  data: UpdateAppointmentStatusPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<RawAppointment>>(
    `/appointments/${appointmentId}/status`,
    data,
  );
  return {
    ...res.data,
    data: normalizeAppointment(res.data.data),
  };
};
