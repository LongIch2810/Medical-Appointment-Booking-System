import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/patient.interface";

export const sendOtp = async (email: string) => {
  const res = await axiosInstance.post<ApiResponse<string>>("/otps/send-otp", {
    email,
  });
  return res.data;
};

export const verifyOtp = async (email: string, otpCode: string) => {
  const res = await axiosInstance.post<ApiResponse<string>>(
    "/otps/verify-otp",
    { email, otpCode }
  );
  return res.data;
};
