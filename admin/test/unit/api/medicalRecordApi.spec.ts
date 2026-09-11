import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";

import {
  getMedicalRecordErrorMessage,
  summarizeMedicalRecord,
} from "@/api/medicalRecordApi";
import axiosInstance from "@/configs/axios";

vi.mock("@/configs/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

function makeAxiosError({
  status,
  details,
  code,
  hasResponse = true,
}: {
  status?: number;
  details?: string | string[];
  code?: string;
  hasResponse?: boolean;
}): AxiosError {
  const err = new AxiosError("Test Error");
  err.name = "AxiosError";
  err.isAxiosError = true;
  if (code) err.code = code;

  if (hasResponse && status !== undefined) {
    err.response = {
      status,
      statusText: "Error",
      headers: {},
      config: {} as unknown as NonNullable<AxiosError["config"]>,
      data: {
        statusCode: status,
        success: false,
        data: null,
        error: {
          code: "TEST_ERROR",
          details: details ?? "Test detail",
        },
      },
    };
  }
  return err;
}

describe("medicalRecordApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("summarizeMedicalRecord", () => {
    it("packages image files into 'images' form field and sends to endpoint", async () => {
      const mockPost = vi.mocked(axiosInstance.post);
      mockPost.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          success: true,
          data: { summary: "# Tóm tắt bệnh án\n- Tiền sử: Khỏe mạnh" },
          error: null,
        },
      });

      const file1 = new File(["img1"], "test1.jpg", { type: "image/jpeg" });
      const file2 = new File(["img2"], "test2.png", { type: "image/png" });

      const res = await summarizeMedicalRecord([file1, file2], "images");

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [url, formData] = mockPost.mock.calls[0];
      expect(url).toBe("/chat-history/summary-medical-record");
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).getAll("images").length).toBe(2);
      expect(res.data.summary).toContain("Tóm tắt bệnh án");
    });

    it("packages single PDF file into 'pdf' form field and sends to endpoint", async () => {
      const mockPost = vi.mocked(axiosInstance.post);
      mockPost.mockResolvedValueOnce({
        data: {
          statusCode: 200,
          success: true,
          data: { summary: "Kết quả PDF" },
          error: null,
        },
      });

      const pdfFile = new File(["%PDF-1.4"], "benh_an.pdf", {
        type: "application/pdf",
      });

      const res = await summarizeMedicalRecord([pdfFile], "pdf");

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [url, formData] = mockPost.mock.calls[0];
      expect(url).toBe("/chat-history/summary-medical-record");
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("pdf")).toBe(pdfFile);
      expect(res.data.summary).toBe("Kết quả PDF");
    });
  });

  describe("getMedicalRecordErrorMessage", () => {
    it("handles 400 error when mixing images and pdf", () => {
      const err = makeAxiosError({
        status: 400,
        details: "Provide either images or one PDF, but not both.",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Vui lòng chọn hoặc tối đa 5 hình ảnh, hoặc đúng 1 file PDF; không chọn cả hai loại cùng lúc.",
      );
    });

    it("handles 400 error when too many files are provided", () => {
      const err = makeAxiosError({
        status: 400,
        details: "Too many medical record files.",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Số lượng tệp vượt quá giới hạn cho phép (tối đa 5 ảnh hoặc 1 file PDF).",
      );
    });

    it("handles 400 error when file exceeds 10 MB", () => {
      const err = makeAxiosError({
        status: 400,
        details: "Each medical record file must be 10 MB or smaller.",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe("Mỗi tệp tải lên phải có dung lượng từ 10 MB trở xuống.");
    });

    it("handles 400 error for unsupported image mime type", () => {
      const err = makeAxiosError({
        status: 400,
        details: "Only JPEG, PNG, and WebP images are supported.",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Định dạng hình ảnh không hợp lệ. Hệ thống chỉ hỗ trợ JPEG, PNG và WebP.",
      );
    });

    it("handles 400 error for non-pdf file in pdf field", () => {
      const err = makeAxiosError({
        status: 400,
        details: "Only PDF files are supported in the pdf field.",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe("Tệp tài liệu không hợp lệ. Chỉ hỗ trợ tệp định dạng PDF.");
    });

    it("handles 401 unauthorized status", () => {
      const err = makeAxiosError({ status: 401 });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Phiên làm việc đã hết hạn hoặc bạn không có quyền thực hiện. Vui lòng đăng nhập lại.",
      );
    });

    it("handles 413 payload too large status", () => {
      const err = makeAxiosError({ status: 413 });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Dung lượng tệp vượt quá giới hạn 10 MB cho phép. Vui lòng nén hoặc chọn tệp nhỏ hơn.",
      );
    });

    it("handles 502 bad gateway status", () => {
      const err = makeAxiosError({ status: 502 });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe("Dịch vụ AI hiện không phản hồi. Vui lòng thử lại sau giây lát.");
    });

    it("handles 504 gateway timeout status", () => {
      const err = makeAxiosError({ status: 504 });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Quá trình xử lý tài liệu quá thời gian chờ (Gateway Timeout). Vui lòng thử lại với tài liệu dung lượng nhỏ hơn hoặc ít trang hơn.",
      );
    });

    it("handles 500 internal server error status without leaking internal trace", () => {
      const err = makeAxiosError({
        status: 500,
        details: "Fatal Postgres deadlock or LLM crash stack trace",
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Hệ thống AI đang gặp sự cố tạm thời khi phân tích bệnh án. Vui lòng thử lại sau.",
      );
    });

    it("handles network timeout (ECONNABORTED)", () => {
      const err = makeAxiosError({
        code: "ECONNABORTED",
        hasResponse: false,
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Quá trình phân tích tài liệu quá thời gian chờ. Vui lòng kiểm tra lại đường truyền mạng và thử lại.",
      );
    });

    it("handles generic network connection failure", () => {
      const err = makeAxiosError({
        hasResponse: false,
      });
      const message = getMedicalRecordErrorMessage(err);
      expect(message).toBe(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
      );
    });
  });
});
