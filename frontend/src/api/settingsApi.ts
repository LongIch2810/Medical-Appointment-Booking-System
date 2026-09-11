import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/patient.interface";
import type {
  UpdateUserSettings,
  UserSettings,
} from "@/types/interface/settings.interface";

export async function fetchUserSettings() {
  const response = await axiosInstance.get<ApiResponse<UserSettings>>(
    "/user-settings/me",
  );
  return response.data;
}

export async function updateUserSettings(body: UpdateUserSettings) {
  const response = await axiosInstance.patch<ApiResponse<UserSettings>>(
    "/user-settings/me",
    body,
  );
  return response.data;
}
