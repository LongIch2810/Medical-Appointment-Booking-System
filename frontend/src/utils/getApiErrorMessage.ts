import type { AxiosError } from "axios";
import type { ApiError } from "@/types/interface/apiError.interface";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>;
  const details = axiosError.response?.data?.error?.details;

  if (typeof details === "string") return details;
  if (Array.isArray(details) && details.length > 0) return details[0];

  return fallback;
}
