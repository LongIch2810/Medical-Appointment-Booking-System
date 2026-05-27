import axios from "axios";

import axiosInstance from "@/configs/axios";
import { normalizeAppointment, type RawAppointment } from "@/api/appointmentApi";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  AdminDashboard,
  DoctorDashboard,
  PatientDashboard,
} from "@/types/interface/dashboard.interface";

type RawDoctorDashboard = Omit<DoctorDashboard, "appointmentToDayEarly"> & {
  appointmentToDayEarly: RawAppointment | null;
};

export const fetchAdminDashboard = async () => {
  const res = await axiosInstance.get<ApiResponse<AdminDashboard>>(
    "/dashboard/admin",
  );
  return res.data;
};

const emptyDoctorDashboard: ApiResponse<DoctorDashboard> = {
  statusCode: 200,
  success: true,
  data: {
    totalAppointmentsToDayCount: 0,
    upcomingAppointmentsCount: 0,
    totalMessagesUnreadInAllChannelsCount: 0,
    appointmentToDayEarly: null,
  },
  error: null,
};

export const fetchDoctorDashboard = async () => {
  try {
    const res = await axiosInstance.get<ApiResponse<RawDoctorDashboard>>(
      "/dashboard/doctor",
    );
    const raw = res.data?.data;
    return {
      ...res.data,
      data: {
        totalAppointmentsToDayCount: raw?.totalAppointmentsToDayCount ?? 0,
        upcomingAppointmentsCount: raw?.upcomingAppointmentsCount ?? 0,
        totalMessagesUnreadInAllChannelsCount:
          raw?.totalMessagesUnreadInAllChannelsCount ?? 0,
        appointmentToDayEarly: raw?.appointmentToDayEarly
          ? normalizeAppointment(raw.appointmentToDayEarly)
          : null,
      },
    } as ApiResponse<DoctorDashboard>;
  } catch (error) {
    // Backend hiện ném 404 khi bác sĩ chưa có lịch hôm nay.
    // Trả về dashboard rỗng để UI vẫn render thay vì error toàn trang.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return emptyDoctorDashboard;
    }
    throw error;
  }
};

export const fetchPatientDashboard = async () => {
  const res = await axiosInstance.get<ApiResponse<PatientDashboard>>(
    "/dashboard/patient",
  );
  return res.data;
};
