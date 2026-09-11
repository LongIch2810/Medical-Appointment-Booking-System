import type { AxiosError } from "axios";
import type { ApiError } from "@/types/interface/apiError.interface";

const TECHNICAL_MESSAGES = new Set([
  "Unauthorized",
  "Bad Request",
  "Conflict",
  "Internal server error",
]);

function getFirstMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    return value.find(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>;
  const response = axiosError.response;
  const serverMessage =
    getFirstMessage(response?.data?.error?.details) ??
    getFirstMessage(response?.data?.message);

  if (serverMessage && !TECHNICAL_MESSAGES.has(serverMessage)) {
    return serverMessage;
  }

  if (!response) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.";
  }

  if (response.status === 400) {
    return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.";
  }
  if (response.status === 401) return fallback;
  if (response.status === 409) {
    return "Tên đăng nhập hoặc email đã được sử dụng.";
  }
  if (response.status === 429) {
    return "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.";
  }
  if (response.status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return fallback;
}
