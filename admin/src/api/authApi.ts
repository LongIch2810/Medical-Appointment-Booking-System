import axiosInstance, { refreshInstance } from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullname: string;
}

export interface SetNewPasswordPayload {
  email: string;
  newPassword: string;
}

export const login = async (data: LoginPayload) => {
  const res = await axiosInstance.post<ApiResponse<LoginResponse>>(
    "/auth/admin/login",
    data,
  );
  return res.data;
};

export const register = async (data: RegisterPayload) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const logout = async () => {
  // Bỏ qua interceptor: logout là endpoint auth, không cần auto-refresh khi 401.
  const res =
    await refreshInstance.post<ApiResponse<{ message: string }>>("/auth/logout");
  return res.data;
};

export const logoutAll = async () => {
  const res =
    await refreshInstance.post<ApiResponse<{ message: string }>>(
      "/auth/logout-all",
    );
  return res.data;
};

export const refresh = async () => {
  // Phải dùng refreshInstance để không trigger interceptor refresh khi 401.
  const res =
    await refreshInstance.post<ApiResponse<{ message: string }>>(
      "/auth/refresh",
    );
  return res.data;
};

export const setNewPassword = async (data: SetNewPasswordPayload) => {
  const res = await axiosInstance.post<ApiResponse<string>>(
    "/auth/set-new-password",
    data,
  );
  return res.data;
};
