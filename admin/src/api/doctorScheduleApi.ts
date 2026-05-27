import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateDoctorSchedulePayload,
  DoctorSchedule,
  GroupedDoctorSchedules,
  UpdateDoctorSchedulePayload,
} from "@/types/interface/doctorSchedule.interface";

export const fetchPersonalSchedules = async () => {
  const res = await axiosInstance.post<ApiResponse<GroupedDoctorSchedules>>(
    "/doctor-schedules/personal-schedules",
  );
  return res.data;
};

export const fetchDoctorSchedules = async (doctorId: number) => {
  const res = await axiosInstance.get<ApiResponse<GroupedDoctorSchedules>>(
    `/doctor-schedules/${doctorId}`,
  );
  return res.data;
};

export const createDoctorSchedule = async (
  data: CreateDoctorSchedulePayload,
) => {
  const res = await axiosInstance.post<ApiResponse<DoctorSchedule>>(
    "/doctor-schedules/create-schedule",
    data,
  );
  return res.data;
};

export const updateDoctorSchedule = async (
  doctorScheduleId: number,
  data: UpdateDoctorSchedulePayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<DoctorSchedule>>(
    `/doctor-schedules/${doctorScheduleId}`,
    data,
  );
  return res.data;
};

export const updateDoctorScheduleStatus = async (
  doctorScheduleId: number,
  isActive: boolean,
) => {
  const res = await axiosInstance.patch<ApiResponse<DoctorSchedule>>(
    `/doctor-schedules/${doctorScheduleId}/status`,
    { is_active: isActive },
  );
  return res.data;
};

export const deleteDoctorSchedule = async (doctorScheduleId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/doctor-schedules/${doctorScheduleId}`,
  );
  return res.data;
};
