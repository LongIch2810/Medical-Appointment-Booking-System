import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/patient.interface";
import type {
  CoachProfile,
  CoachProfilePayload,
} from "@/types/interface/coachProfile.interface";

export const fetchMyCoachProfile = async () => {
  const res = await axiosInstance.get<ApiResponse<CoachProfile>>(
    "/coach-profile/me",
  );
  return res.data;
};

export const createCoachProfile = async (data: CoachProfilePayload) => {
  const res = await axiosInstance.post<ApiResponse<CoachProfile>>(
    "/coach-profile",
    data,
  );
  return res.data;
};

export const updateCoachProfile = async (data: CoachProfilePayload) => {
  const res = await axiosInstance.patch<ApiResponse<CoachProfile>>(
    "/coach-profile",
    data,
  );
  return res.data;
};
