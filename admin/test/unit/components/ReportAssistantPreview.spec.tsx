import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { revealAdminReportQuery } from "@/api/adminReportApi";
import { ReportAssistantPreview } from "@/components/app/ReportAssistantPreview";
import type { AdminReport } from "@/types/interface/adminReport.interface";

vi.mock("@/api/adminReportApi", () => ({ revealAdminReportQuery: vi.fn() }));

const sql = "SELECT status FROM chatbot_report_appointments_view LIMIT 1";
const report: AdminReport = {
  id: 44,
  createdAt: "2026-09-25T00:00:00Z",
  reportType: "CONVERSATIONAL",
  rangeLabel: "01/09/2026 - 30/09/2026",
  hasExecutedQuery: true,
  executedQuery: sql,
  pdfUrl: null,
  report: null,
  chartConfig: null,
  tableColumns: [],
  tableRows: [],
};

describe("ReportAssistantPreview SQL reveal", () => {
  it("reveals SQL on demand and toggles visibility without refetching", async () => {
    const user = userEvent.setup();
    const reveal = vi.mocked(revealAdminReportQuery);
    reveal.mockReset();
    reveal.mockResolvedValueOnce(sql);

    render(<ReportAssistantPreview report={report} />);
    await user.click(screen.getByText("Câu SQL và yêu cầu dùng để tạo báo cáo"));
    expect(screen.queryByText(sql)).not.toBeInTheDocument();
    expect(screen.getByText("********")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sao chép SQL" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xem SQL" }));
    await waitFor(() => expect(screen.getByText(sql)).toBeInTheDocument());
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal).toHaveBeenCalledWith(44);
    expect(screen.getByRole("button", { name: "Sao chép SQL" })).toBeInTheDocument();
    expect(screen.queryByText("********")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ẩn SQL" }));
    expect(screen.queryByText(sql)).not.toBeInTheDocument();
    expect(screen.getByText("********")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xem SQL" }));
    expect(screen.getByText(sql)).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledTimes(1);
  }, 15_000);
});
