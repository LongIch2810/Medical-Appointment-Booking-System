import axios, { type AxiosError } from "axios";

import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type { ApiError } from "@/types/interface/apiError.interface";
import type {
  MedicalRecordSummaryData,
  MedicalRecordUploadMode,
  MedicalRecordSummaryHistoryItem,
} from "@/types/interface/medicalRecord.interface";

export async function summarizeMedicalRecord(
  files: File[],
  mode: MedicalRecordUploadMode,
  signal?: AbortSignal,
): Promise<ApiResponse<MedicalRecordSummaryData>> {
  const formData = new FormData();

  if (mode === "images") {
    files.forEach((file) => {
      formData.append("images", file);
    });
  } else {
    if (files[0]) {
      formData.append("pdf", files[0]);
    }
  }

  // Do not manually set 'Content-Type': axios and browser will generate multipart/form-data with boundary
  const response = await axiosInstance.post<ApiResponse<MedicalRecordSummaryData>>(
    "/chat-history/summary-medical-record",
    formData,
    {
      signal,
    },
  );

  return response.data;
}

export async function getMedicalRecordSummaryHistory(page = 1, limit = 10) {
  const response = await axiosInstance.get<ApiResponse<{ summaries: MedicalRecordSummaryHistoryItem[]; total: number; page: number; limit: number; totalPages: number }>>(
    "/medical-record-summaries",
    { params: { page, limit } },
  );
  return response.data;
}

export async function getMedicalRecordSummary(id: number) {
  const response = await axiosInstance.get<ApiResponse<MedicalRecordSummaryData & { id: number; createdAt: string; inputMode: string }>>(`/medical-record-summaries/${id}`);
  return response.data;
}

export async function deleteMedicalRecordSummary(id: number) {
  const response = await axiosInstance.delete<ApiResponse<{ success: boolean }>>(`/medical-record-summaries/${id}`);
  return response.data;
}

export function getMedicalRecordErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiError>;

    if (axiosErr.code === "ECONNABORTED") {
      return "Quá trình phân tích tài liệu quá thời gian chờ. Vui lòng kiểm tra lại đường truyền mạng và thử lại.";
    }

    if (!axiosErr.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }

    const status = axiosErr.response.status;
    const details = axiosErr.response.data?.error?.details;
    const detailString = Array.isArray(details)
      ? details.join(", ")
      : typeof details === "string"
        ? details
        : "";

    switch (status) {
      case 400: {
        if (detailString.includes("Provide either images or one PDF")) {
          return "Vui lòng chọn hoặc tối đa 5 hình ảnh, hoặc đúng 1 file PDF; không chọn cả hai loại cùng lúc.";
        }
        if (detailString.includes("Too many medical record files")) {
          return "Số lượng tệp vượt quá giới hạn cho phép (tối đa 5 ảnh hoặc 1 file PDF).";
        }
        if (detailString.includes("10 MB")) {
          return "Mỗi tệp tải lên phải có dung lượng từ 10 MB trở xuống.";
        }
        if (detailString.includes("JPEG, PNG, and WebP")) {
          return "Định dạng hình ảnh không hợp lệ. Hệ thống chỉ hỗ trợ JPEG, PNG và WebP.";
        }
        if (detailString.includes("Only PDF files")) {
          return "Tệp tài liệu không hợp lệ. Chỉ hỗ trợ tệp định dạng PDF.";
        }
        return "Tài liệu tải lên không hợp lệ. Vui lòng kiểm tra lại định dạng và dung lượng tệp.";
      }
      case 401:
        return "Phiên làm việc đã hết hạn hoặc bạn không có quyền thực hiện. Vui lòng đăng nhập lại.";
      case 413:
        return "Dung lượng tệp vượt quá giới hạn 10 MB cho phép. Vui lòng nén hoặc chọn tệp nhỏ hơn.";
      case 502:
        return "Dịch vụ AI hiện không phản hồi. Vui lòng thử lại sau giây lát.";
      case 504:
        return "Quá trình xử lý tài liệu quá thời gian chờ (Gateway Timeout). Vui lòng thử lại với tài liệu dung lượng nhỏ hơn hoặc ít trang hơn.";
      case 500:
        return "Hệ thống AI đang gặp sự cố tạm thời khi phân tích bệnh án. Vui lòng thử lại sau.";
      default:
        return "Không thể tóm tắt bệnh án lúc này. Vui lòng thử lại sau.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định khi tạo tóm tắt bệnh án. Vui lòng thử lại.";
}
