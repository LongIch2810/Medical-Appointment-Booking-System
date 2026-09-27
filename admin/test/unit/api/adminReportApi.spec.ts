import { describe, expect, it, vi } from "vitest";

import {
  getAdminReportDetail,
  getAdminReportHistory,
} from "@/api/adminReportApi";
import axiosInstance from "@/configs/axios";

vi.mock("@/configs/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("adminReportApi - history endpoints", () => {
  it("getAdminReportHistory forwards query params to GET /admin-reports/history", async () => {
    const mockResponse = {
      data: {
        statusCode: 200,
        success: true,
        data: {
          reports: [
            {
              id: 1,
              createdAt: "2026-09-01T08:00:00Z",
              reportType: "CONVERSATIONAL",
              rangeLabel: "01/09/2026 - 07/09/2026",
              pdfUrl: "/api/v1/admin-reports/history/1/file",
              report: null,
              chartConfig: null,
              tableColumns: [],
              tableRows: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };

    vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse);

    const result = await getAdminReportHistory({
      page: 1,
      limit: 10,
      reportType: "CONVERSATIONAL",
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/admin-reports/history", {
      params: { page: 1, limit: 10, reportType: "CONVERSATIONAL" },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("getAdminReportDetail calls GET /admin-reports/history/:id", async () => {
    const mockResponse = {
      data: {
        statusCode: 200,
        success: true,
        data: {
          id: 5,
          createdAt: "2026-09-01T08:00:00Z",
          reportType: "CONVERSATIONAL",
          rangeLabel: "Tháng 8/2026",
          pdfUrl: "/api/v1/admin-reports/history/5/file",
          report: null,
          chartConfig: null,
          tableColumns: [],
          tableRows: [],
        },
      },
    };

    vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse);

    const result = await getAdminReportDetail(5);

    expect(axiosInstance.get).toHaveBeenCalledWith("/admin-reports/history/5");
    expect(result).toEqual(mockResponse.data);
  });
});
