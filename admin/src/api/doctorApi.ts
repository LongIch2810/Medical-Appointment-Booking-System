import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateDoctorPayload,
  Doctor,
  DoctorListPayload,
  DoctorListResponse,
  UpdateDoctorPayload,
} from "@/types/interface/doctor.interface";

export const fetchDoctors = async (data: DoctorListPayload) => {
  const res = await axiosInstance.post<ApiResponse<DoctorListResponse>>(
    "/doctors",
    data,
  );
  return res.data;
};

export const fetchOutstandingDoctors = async () => {
  const res = await axiosInstance.get<ApiResponse<Doctor[]>>(
    "/doctors/outstanding-doctors",
  );
  return res.data;
};

export const fetchDoctorDetail = async (doctorId: number) => {
  const res = await axiosInstance.get<ApiResponse<Doctor>>(
    `/doctors/${doctorId}`,
  );
  return res.data;
};

export const createDoctor = async (data: CreateDoctorPayload) => {
  const res = await axiosInstance.post<ApiResponse<Doctor>>(
    "/doctors/create",
    data,
  );
  return res.data;
};

export const updateDoctor = async (
  doctorId: number,
  data: UpdateDoctorPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Doctor>>(
    `/doctors/${doctorId}`,
    data,
  );
  return res.data;
};

export const deleteDoctor = async (doctorId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/doctors/${doctorId}`,
  );
  return res.data;
};
