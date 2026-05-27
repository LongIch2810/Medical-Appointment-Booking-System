import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  Specialty,
  SpecialtyListPayload,
  SpecialtyListResponse,
  UpdateSpecialtyPayload,
} from "@/types/interface/specialty.interface";

export const fetchSpecialties = async (data: SpecialtyListPayload) => {
  const res = await axiosInstance.post<ApiResponse<SpecialtyListResponse>>(
    "/specialties",
    data,
  );
  return res.data;
};

export const fetchSpecialtyDetail = async (specialtyId: number) => {
  const res = await axiosInstance.get<ApiResponse<Specialty>>(
    `/specialties/${specialtyId}`,
  );
  return res.data;
};

export const createSpecialty = async (data: {
  name: string;
  description: string;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("file", data.file);
  const res = await axiosInstance.post<ApiResponse<Specialty>>(
    "/specialties/create-specialty",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const updateSpecialty = async (
  specialtyId: number,
  data: UpdateSpecialtyPayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Specialty>>(
    `/specialties/${specialtyId}`,
    data,
  );
  return res.data;
};

export const deleteSpecialty = async (specialtyId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/specialties/${specialtyId}`,
  );
  return res.data;
};
