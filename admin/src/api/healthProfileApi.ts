import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  HealthProfile,
  HealthProfileListPayload,
  HealthProfileListResponse,
  UpdateHealthProfilePayload,
} from "@/types/interface/healthProfile.interface";

export const fetchAdminHealthProfiles = async (
  data: HealthProfileListPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<HealthProfileListResponse>>(
    "/health-profiles/admin/list",
    data,
  );
  return res.data;
};

export const fetchPersonalHealthProfiles = async (
  data: HealthProfileListPayload,
) => {
  const res = await axiosInstance.post<ApiResponse<HealthProfileListResponse>>(
    "/health-profiles/patient/list",
    data,
  );
  return res.data;
};

export const fetchHealthProfileByRelativeId = async (relativeId: number) => {
  const res = await axiosInstance.get<ApiResponse<HealthProfile>>(
    `/health-profiles/${relativeId}`,
  );
  return res.data;
};

export const updateHealthProfile = async (
  relativeId: number,
  data: UpdateHealthProfilePayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<HealthProfile>>(
    `/health-profiles/update/${relativeId}`,
    data,
  );
  return res.data;
};
