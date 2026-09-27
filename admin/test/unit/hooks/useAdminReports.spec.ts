import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  adminReportQueryKeys,
  useAdminReportDetail,
  useAdminReportHistory,
} from "@/hooks/useAdminReports";
import * as adminReportApi from "@/api/adminReportApi";

vi.mock("@/api/adminReportApi", () => ({
  getAdminReportHistory: vi.fn(),
  getAdminReportDetail: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useAdminReports", () => {
  it("constructs predictable query keys", () => {
    expect(adminReportQueryKeys.all).toEqual(["admin-reports"]);
    expect(adminReportQueryKeys.history({ page: 1, limit: 10 })).toEqual([
      "admin-reports",
      "history",
      { page: 1, limit: 10 },
    ]);
    expect(adminReportQueryKeys.detail(42)).toEqual([
      "admin-reports",
      "detail",
      42,
    ]);
  });

  it("useAdminReportHistory fetches report history with provided filters", async () => {
    const mockData = {
      statusCode: 200,
      success: true,
      data: {
        reports: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };

    vi.mocked(adminReportApi.getAdminReportHistory).mockResolvedValueOnce(
      mockData as never,
    );

    const { result } = renderHook(
      () =>
        useAdminReportHistory({
          page: 1,
          limit: 10,
          reportType: "CONVERSATIONAL",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminReportApi.getAdminReportHistory).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      reportType: "CONVERSATIONAL",
    });
    expect(result.current.data).toEqual(mockData);
  });

  it("useAdminReportDetail is disabled when id is 0 or null", () => {
    const { result } = renderHook(() => useAdminReportDetail(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(adminReportApi.getAdminReportDetail).not.toHaveBeenCalled();
  });

  it("useAdminReportDetail fetches detail when id is a valid positive number", async () => {
    const mockDetail = {
      statusCode: 200,
      success: true,
      data: {
        id: 7,
        createdAt: "2026-09-01T08:00:00Z",
        reportType: "CONVERSATIONAL",
        rangeLabel: "01/09/2026 - 07/09/2026",
        pdfUrl: "/api/v1/admin-reports/history/7/file",
        report: null,
        chartConfig: null,
        tableColumns: [],
        tableRows: [],
      },
    };

    vi.mocked(adminReportApi.getAdminReportDetail).mockResolvedValueOnce(
      mockDetail as never,
    );

    const { result } = renderHook(() => useAdminReportDetail(7), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(adminReportApi.getAdminReportDetail).toHaveBeenCalledWith(7);
    expect(result.current.data).toEqual(mockDetail);
  });
});
