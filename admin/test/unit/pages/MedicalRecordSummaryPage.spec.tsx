import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/configs/axios";
import { MedicalRecordSummaryPage } from "@/pages/MedicalRecordSummaryPage";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/configs/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("MedicalRecordSummaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page header, eyebrow, AI badge, and empty state initially", () => {
    renderWithProviders(<MedicalRecordSummaryPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tóm tắt bệnh án bằng AI" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AI Hỗ trợ lâm sàng")).toBeInTheDocument();
    expect(screen.getByText("AI hỗ trợ")).toBeInTheDocument();

    expect(screen.getByText("Chưa có bản tóm tắt bệnh án")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tạo tóm tắt bệnh án" }),
    ).toBeDisabled();
  });

  it("switches between image and PDF upload tabs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MedicalRecordSummaryPage />);

    const imageTab = screen.getByRole("tab", { name: /Tải ảnh/ });
    const pdfTab = screen.getByRole("tab", { name: /Tải PDF/ });

    expect(imageTab).toHaveAttribute("aria-selected", "true");
    expect(pdfTab).toHaveAttribute("aria-selected", "false");

    await user.click(pdfTab);

    expect(imageTab).toHaveAttribute("aria-selected", "false");
    expect(pdfTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByText("Hỗ trợ 1 file PDF (bệnh án, kết quả xét nghiệm, ≤ 10 MB)"),
    ).toBeInTheDocument();
  });

  it("allows selecting image files, updates preview, and enables submit button", async () => {
    renderWithProviders(<MedicalRecordSummaryPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(["test-image-content"], "don_thuoc.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText("don_thuoc.jpg")).toBeInTheDocument();
    expect(screen.getByText("Hình ảnh đã chọn (1/5)")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: "Tạo tóm tắt bệnh án",
    });
    expect(submitBtn).not.toBeDisabled();
  });

  it("validates file size and shows friendly error when exceeding 10 MB", async () => {
    renderWithProviders(<MedicalRecordSummaryPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a mock large file > 10 MB
    const largeFile = new File(["a".repeat(100)], "benh_an_nang.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(largeFile, "size", {
      value: 12 * 1024 * 1024, // 12 MB
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      await screen.findByText(/vượt quá dung lượng tối đa 10 MB/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tạo tóm tắt bệnh án" }),
    ).toBeDisabled();
  });

  it("removes individual file from preview when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MedicalRecordSummaryPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["content"], "xquang.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText("xquang.png")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: "Xóa ảnh xquang.png" });
    await user.click(deleteBtn);

    expect(screen.queryByText("xquang.png")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tạo tóm tắt bệnh án" }),
    ).toBeDisabled();
  });

  it("submits files, shows loading state, and renders AI markdown summary and clinical warning", async () => {
    let resolvePost: (value: unknown) => void = () => {};
    const mockPost = vi.mocked(axiosInstance.post);
    mockPost.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MedicalRecordSummaryPage />);

    // Switch to PDF tab
    const pdfTab = screen.getByRole("tab", { name: /Tải PDF/ });
    await user.click(pdfTab);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["pdf content"], "ho_so.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText("ho_so.pdf")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: "Tạo tóm tắt bệnh án",
    });
    await user.click(submitBtn);

    // Expect loading state while request is in flight
    expect(
      screen.getAllByText(/Đang đọc và tóm tắt bệnh án/).length,
    ).toBeGreaterThanOrEqual(1);

    // Now resolve the mock API response
    resolvePost({
      data: {
        statusCode: 200,
        success: true,
        data: {
          summary:
            "## 1. Thông tin chung\nBệnh nhân nam, 45 tuổi.\n\n## 2. Tiền sử bệnh\nTăng huyết áp 3 năm.\n\n## 3. Khuyến nghị\nTheo dõi huyết áp hàng ngày.",
        },
        error: null,
      },
    });

    // Expect AI summary output rendered
    await waitFor(() => {
      expect(screen.getByText("Bản tóm tắt bệnh án AI")).toBeInTheDocument();
    });

    expect(screen.getByText(/Thông tin chung/)).toBeInTheDocument();
    expect(
      screen.getByText("Bệnh nhân nam, 45 tuổi."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tiền sử bệnh/)).toBeInTheDocument();
    expect(screen.getByText("Tăng huyết áp 3 năm.")).toBeInTheDocument();

    // Check mandatory clinical safety disclaimer banner (Requirement 8)
    expect(
      screen.getByText(/Nội dung do AI hỗ trợ tổng hợp từ tài liệu tải lên/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Bác sĩ cần đối chiếu bệnh án gốc và chịu trách nhiệm cho quyết định chuyên môn/,
      ),
    ).toBeInTheDocument();

    // Check copy button
    expect(
      screen.getByRole("button", { name: "Sao chép nội dung tóm tắt bệnh án" }),
    ).toBeInTheDocument();
  });
});
