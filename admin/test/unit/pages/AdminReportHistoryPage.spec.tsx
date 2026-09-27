import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AdminReportHistoryPage } from "@/pages/AdminReportHistoryPage";
import type { AdminReport } from "@/types/interface/adminReport.interface";
import * as openAdminReportUtils from "@/utils/open-admin-report-file";

const hookMock = vi.hoisted(() => ({
  useAdminReportHistory: vi.fn(),
}));

vi.mock("@/hooks/useAdminReports", () => ({
  useAdminReportHistory: hookMock.useAdminReportHistory,
}));

vi.mock("@/utils/open-admin-report-file", () => ({
  openAdminReportFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/app/ReportAssistantPreview", () => ({
  ReportAssistantPreview: ({ report }: { report: AdminReport }) => (
    <div data-testid="mock-report-preview">
      Bản xem trước báo cáo #{report.id}
    </div>
  ),
}));

const sampleReports: AdminReport[] = [
  {
    id: 101,
    createdAt: "20/09/2026 14:30",
    createdBy: { id: 1, fullname: "Nguyễn Văn Admin" },
    reportType: "CONVERSATIONAL",
    rangeLabel: "01/09/2026 - 15/09/2026",
    sourceRequest: "Phân tích số ca khám hoàn tất theo bác sĩ",
    pdfUrl: "/api/v1/admin-reports/history/101/file",
    fileName: "bao-cao-bac-si.pdf",
    report: {
      title: "Báo cáo năng suất bác sĩ tháng 9",
      analysis: [{ section_title: "Tổng quan", content: "Đạt hiệu suất 95%" }],
      insights: ["Số ca khám tăng mạnh"],
      strategic_recommendations: [],
      economic_context: "",
      footer: "",
    },
    chartConfig: null,
    tableColumns: [{ key: "doctor", label: "Bác sĩ" }],
    tableRows: [{ doctor: "BS. Hùng" }],
  },
  {
    id: 102,
    createdAt: "18/09/2026 09:15",
    createdBy: { id: 2, fullname: "Lê Thị Bác Sĩ" },
    reportType: "APPOINTMENTS_BY_SPECIALTY",
    rangeLabel: "Tháng 8/2026",
    sourceRequest: null,
    pdfUrl: null, // Chưa có PDF
    fileName: null,
    report: null,
    chartConfig: null,
    tableColumns: [],
    tableRows: [],
  },
];

describe("AdminReportHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and navigation link to assistant", () => {
    hookMock.useAdminReportHistory.mockReturnValue({
      data: { data: { reports: [], total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Lịch sử báo cáo")).toBeInTheDocument();
    expect(screen.getByText("Tạo báo cáo với AI")).toBeInTheDocument();
  });

  it("shows loading state when data is being fetched", () => {
    hookMock.useAdminReportHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isFetching: true,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Đang tải dữ liệu...")).toBeInTheDocument();
  });

  it("shows error state with working retry button when query fails", async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();

    hookMock.useAdminReportHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Không thể tải dữ liệu")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Thử lại/i });
    await user.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("shows empty state when no reports match the query", () => {
    hookMock.useAdminReportHistory.mockReturnValue({
      data: { data: { reports: [], total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Chưa có báo cáo nào")).toBeInTheDocument();
  });

  it("renders report rows with details and operates PDF view/download actions", async () => {
    const user = userEvent.setup();

    hookMock.useAdminReportHistory.mockReturnValue({
      data: {
        data: {
          reports: sampleReports,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText("Báo cáo năng suất bác sĩ tháng 9")).toBeInTheDocument();
    expect(
      screen.getByText(/Phân tích số ca khám hoàn tất theo bác sĩ/),
    ).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn Admin")).toBeInTheDocument();
    expect(screen.getByText("Trợ lý AI")).toBeInTheDocument();

    expect(screen.getByText("#102")).toBeInTheDocument();
    expect(screen.getByText("APPOINTMENTS_BY_SPECIALTY")).toBeInTheDocument();

    // Click "Mở PDF" on report 101
    const openPdfButtons = screen.getAllByRole("button", { name: /Mở PDF/i });
    await user.click(openPdfButtons[0]);
    expect(openAdminReportUtils.openAdminReportFile).toHaveBeenCalledWith(
      101,
      false,
    );

    // Click "Tải PDF" on report 101
    const downloadPdfButtons = screen.getAllByRole("button", { name: /Tải PDF/i });
    await user.click(downloadPdfButtons[0]);
    expect(openAdminReportUtils.openAdminReportFile).toHaveBeenCalledWith(
      101,
      true,
    );

    // Report 102 has no pdfUrl, so its buttons are disabled
    expect(openPdfButtons[1]).toBeDisabled();
    expect(downloadPdfButtons[1]).toBeDisabled();
  });

  it("opens the detail preview modal when 'Xem chi tiết' is clicked", async () => {
    const user = userEvent.setup();

    hookMock.useAdminReportHistory.mockReturnValue({
      data: {
        data: {
          reports: sampleReports,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    const detailButtons = screen.getAllByRole("button", { name: /Xem chi tiết/i });
    await user.click(detailButtons[0]);

    // Modal header and mock preview component should be displayed
    await waitFor(() => {
      expect(screen.getByText("Chi tiết báo cáo #101")).toBeInTheDocument();
      expect(screen.getByTestId("mock-report-preview")).toBeInTheDocument();
    });
  });

  it("resets filter back to CONVERSATIONAL on reset button click", async () => {
    const user = userEvent.setup();

    hookMock.useAdminReportHistory.mockReturnValue({
      data: {
        data: {
          reports: sampleReports,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    render(
      <MemoryRouter>
        <AdminReportHistoryPage />
      </MemoryRouter>,
    );

    const select = screen.getByLabelText("Loại báo cáo");
    fireEvent.change(select, { target: { value: "NEW_USER_REGISTRATIONS" } });

    const resetBtn = screen.getByRole("button", {
      name: /Xóa các bộ lọc nâng cao/i,
    });
    await user.click(resetBtn);

    expect(hookMock.useAdminReportHistory).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: "CONVERSATIONAL", page: 1 }),
    );
  });
});
