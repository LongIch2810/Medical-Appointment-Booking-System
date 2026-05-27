import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  CreateRelativePayload,
  Relative,
  RelativeListPayload,
  RelativeListResponse,
  UpdateRelativePayload,
} from "@/types/interface/relative.interface";

export const fetchAdminRelatives = async (data: RelativeListPayload) => {
  const res = await axiosInstance.post<ApiResponse<RelativeListResponse>>(
    "/relatives/admin/relatives",
    data,
  );
  return res.data;
};

export const fetchPersonalRelatives = async (params?: RelativeListPayload) => {
  const res = await axiosInstance.get<ApiResponse<RelativeListResponse>>(
    "/relatives/patient/relatives",
    { params },
  );
  return res.data;
};

export const fetchRelativeDetail = async (relativeId: number) => {
  const res = await axiosInstance.get<ApiResponse<Relative>>(
    `/relatives/${relativeId}`,
  );
  return res.data;
};

export const createRelative = async (data: CreateRelativePayload) => {
  const res = await axiosInstance.post<ApiResponse<Relative>>(
    "/relatives",
    data,
  );
  return res.data;
};

export const updateRelative = async (
  relativeId: number,
  data: UpdateRelativePayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<Relative>>(
    `/relatives/${relativeId}`,
    data,
  );
  return res.data;
};

export const deleteRelative = async (relativeId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/relatives/${relativeId}`,
  );
  return res.data;
};
