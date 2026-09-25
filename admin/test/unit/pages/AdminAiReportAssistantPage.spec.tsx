import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminAiReportAssistantPage } from "@/pages/AdminAiReportAssistantPage";
import type {
  AdminReport,
  ReportAssistantConversationDetailResponse,
} from "@/types/interface/adminReport.interface";

const hookMocks = vi.hoisted(() => ({
  useConfirmReportAssistantPlan: vi.fn(),
  useCreateReportAssistantConversation: vi.fn(),
  useLoadOlderReportAssistantMessages: vi.fn(),
  useReportAssistantConversation: vi.fn(),
  useReportAssistantConversations: vi.fn(),
  useSendReportAssistantMessage: vi.fn(),
}));

vi.mock("@/hooks/useAdminReportAssistant", () => hookMocks);

const baseReport: AdminReport = {
  id: 44,
  createdAt: "2026-08-20T10:00:00Z",
  reportType: "CONVERSATIONAL",
  rangeLabel: "01/08/2026 - 31/08/2026",
  pdfUrl: null,
  fileName: "assistant-report.pdf",
  report: {
    title: "Lịch hẹn theo chuyên khoa",
    analysis: [{ section_title: "Tổng quan", content: "Có 12 lịch hẹn." }],
    insights: ["Dữ liệu được truy vấn trực tiếp."],
    strategic_recommendations: [],
    economic_context: "",
    footer: "",
  },
  chartConfig: null,
  tableColumns: [{ key: "appointment_count", label: "Số lịch hẹn" }],
  tableRows: [{ appointment_count: 12 }],
};

function detail(
  messages: ReportAssistantConversationDetailResponse["messages"] = [],
): ReportAssistantConversationDetailResponse {
  return {
    conversation: {
      id: 5,
      title: "Báo cáo lịch hẹn",
      createdAt: "2026-08-20T10:00:00Z",
      updatedAt: "2026-08-20T10:00:00Z",
    },
    messages,
    nextBeforeMessageId: null,
  };
}

function setDefaultHooks(
  messages: ReportAssistantConversationDetailResponse["messages"] = [],
  includeConversation = false,
) {
  const create = vi
    .fn()
    .mockResolvedValue({ data: { conversation: { id: 5 } } });
  const send = vi.fn().mockResolvedValue({});
  const confirm = vi.fn().mockResolvedValue({});
  const loadOlder = vi
    .fn()
    .mockResolvedValue({ data: { messages: [], nextBeforeMessageId: null } });
  hookMocks.useReportAssistantConversations.mockReturnValue({
    data: {
      data: {
        conversations: includeConversation ? [detail().conversation] : [],
        total: Number(includeConversation),
        page: 1,
        limit: 20,
        totalPages: Number(includeConversation),
      },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  hookMocks.useReportAssistantConversation.mockImplementation(
    (id: number | null) => ({
      data: id === 5 ? { data: detail(messages) } : undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  );
  hookMocks.useCreateReportAssistantConversation.mockReturnValue({
    mutateAsync: create,
    reset: vi.fn(),
    isPending: false,
    error: null,
  });
  hookMocks.useSendReportAssistantMessage.mockReturnValue({
    mutateAsync: send,
    reset: vi.fn(),
    isPending: false,
    error: null,
  });
  hookMocks.useConfirmReportAssistantPlan.mockReturnValue({
    mutateAsync: confirm,
    reset: vi.fn(),
    isPending: false,
    error: null,
  });
  hookMocks.useLoadOlderReportAssistantMessages.mockReturnValue({
    mutateAsync: loadOlder,
    reset: vi.fn(),
    isPending: false,
    error: null,
  });
  return { create, send, confirm, loadOlder };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("AdminAiReportAssistantPage", () => {
  it("starts a conversation from a Vietnamese quick prompt", async () => {
    const user = userEvent.setup();
    const { create } = setDefaultHooks();
    render(<AdminAiReportAssistantPage />);

    await user.click(
      screen.getByRole("button", {
        name: /So sánh số lịch hẹn theo chuyên khoa/,
      }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        "So sánh số lịch hẹn theo chuyên khoa trong tháng này với tháng trước.",
      ),
    );
  });

  it("sends a follow-up with Enter and keeps Shift+Enter for a newline", async () => {
    const { send } = setDefaultHooks(
      [
        {
          id: 12,
          role: "ASSISTANT",
          action: "CLARIFY",
          content: "Bạn muốn so sánh với kỳ nào?",
          plan: null,
          report: null,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    render(<AdminAiReportAssistantPage />);
    const composer = screen.getByRole("textbox", { name: "Tin nhắn của bạn" });

    fireEvent.change(composer, {
      target: { value: "So sánh với tháng trước" },
    });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: true });
    expect(send).not.toHaveBeenCalled();
    expect(composer).toHaveValue("So sánh với tháng trước");

    fireEvent.keyDown(composer, { key: "Enter" });
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({
        id: 5,
        message: "So sánh với tháng trước",
      }),
    );
  });

  it("shows an explicit confirm action only for the latest proposed plan", async () => {
    const user = userEvent.setup();
    const { confirm } = setDefaultHooks(
      [
        {
          id: 19,
          role: "ASSISTANT",
          action: "PROPOSE_PLAN",
          content: "Đây là kế hoạch. Hãy xác nhận trước khi tạo.",
          plan: {
            schemaVersion: 1,
            title: "Lịch hẹn theo chuyên khoa",
            objective: "So sánh số lịch hẹn theo chuyên khoa.",
            query: "Tổng hợp số lịch hẹn theo chuyên khoa trong kỳ.",
            fromDate: "2026-08-01",
            toDate: "2026-08-31",
            comparisonFromDate: null,
            comparisonToDate: null,
            metrics: ["appointment_count"],
            groupBy: ["specialty_name"],
            sourceViews: ["chatbot_report_appointments_view"],
          },
          report: null,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    render(<AdminAiReportAssistantPage />);

    await user.click(
      screen.getByRole("button", { name: "Xác nhận và tạo báo cáo" }),
    );
    expect(confirm).toHaveBeenCalledWith({ id: 5, messageId: 19 });
  });

  it("explains report rate limits and does not offer an immediate retry", async () => {
    const user = userEvent.setup();
    const { confirm } = setDefaultHooks(
      [
        {
          id: 19,
          role: "ASSISTANT",
          action: "PROPOSE_PLAN",
          content: "Đây là kế hoạch. Hãy xác nhận trước khi tạo.",
          plan: {
            schemaVersion: 1,
            title: "Lịch hẹn theo chuyên khoa",
            objective: "So sánh số lịch hẹn theo chuyên khoa.",
            query: "Tổng hợp số lịch hẹn theo chuyên khoa trong kỳ.",
            fromDate: "2026-08-01",
            toDate: "2026-08-31",
            comparisonFromDate: null,
            comparisonToDate: null,
            metrics: ["appointment_count"],
            groupBy: ["specialty_name"],
            sourceViews: ["chatbot_report_appointments_view"],
          },
          report: null,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    const rateLimitError = {
      response: { data: { error: { code: "CHATBOT_RATE_LIMITED" } } },
    };
    confirm.mockRejectedValue(rateLimitError);
    hookMocks.useConfirmReportAssistantPlan.mockReturnValue({
      mutateAsync: confirm,
      reset: vi.fn(),
      isPending: false,
      error: rateLimitError,
    });
    render(<AdminAiReportAssistantPage />);

    await user.click(
      screen.getByRole("button", { name: "Xác nhận và tạo báo cáo" }),
    );

    expect(
      await screen.findByText(
        "Đã đạt giới hạn tạo báo cáo trong giờ hiện tại. Vui lòng thử lại sau.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Thử lại" }),
    ).not.toBeInTheDocument();
  });

  it("loads older conversation messages by cursor", async () => {
    const user = userEvent.setup();
    const { loadOlder } = setDefaultHooks(
      [
        {
          id: 50,
          role: "ASSISTANT",
          action: "ANSWER",
          content: "Recent response",
          plan: null,
          report: null,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    hookMocks.useReportAssistantConversation.mockImplementation(() => ({
      data: {
        data: {
          conversation: detail().conversation,
          messages: [
            {
              id: 50,
              role: "ASSISTANT",
              action: "ANSWER",
              content: "Recent response",
              plan: null,
              report: null,
              createdAt: "2026-08-20T10:00:00Z",
            },
          ],
          nextBeforeMessageId: 30,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));
    render(<AdminAiReportAssistantPage />);

    await user.click(
      screen.getByRole("button", { name: "Tải tin nhắn cũ hơn" }),
    );
    expect(loadOlder).toHaveBeenCalledWith({ id: 5, beforeMessageId: 30 });
  });

  it("renders a report preview for a generated report and does not show a plan action for refusal", () => {
    setDefaultHooks(
      [
        {
          id: 22,
          role: "ASSISTANT",
          action: "GENERATE_REPORT",
          content: "Đã tạo báo cáo.",
          plan: null,
          report: baseReport,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    const { rerender } = render(<AdminAiReportAssistantPage />);

    expect(screen.getByText("Lịch hẹn theo chuyên khoa")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xuất CSV/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Xác nhận và tạo báo cáo" }),
    ).not.toBeInTheDocument();

    setDefaultHooks(
      [
        {
          id: 23,
          role: "ASSISTANT",
          action: "REFUSE",
          content: "Dữ liệu doanh thu hiện chưa được cung cấp.",
          plan: null,
          report: null,
          createdAt: "2026-08-20T10:01:00Z",
        },
      ],
      true,
    );
    rerender(<AdminAiReportAssistantPage />);
    expect(
      screen.getByText("Dữ liệu doanh thu hiện chưa được cung cấp."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Xuất CSV/ }),
    ).not.toBeInTheDocument();
  });

  it("toggles expandable technical details in the plan card", async () => {
    const user = userEvent.setup();
    setDefaultHooks(
      [
        {
          id: 19,
          role: "ASSISTANT",
          action: "PROPOSE_PLAN",
          content: "Kế hoạch đã lập.",
          plan: {
            schemaVersion: 1,
            title: "Lịch hẹn theo chuyên khoa",
            objective: "Đo lường phân bố chuyên khoa",
            query: "Tổng hợp lịch hẹn theo chuyên khoa",
            fromDate: "2026-08-01",
            toDate: "2026-08-31",
            metrics: ["appointment_count"],
            groupBy: ["specialty_name"],
            sourceViews: ["chatbot_report_appointments_view"],
          },
          report: null,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    render(<AdminAiReportAssistantPage />);

    expect(
      screen.queryByText(/Nguồn dữ liệu trích xuất:/),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Xem chi tiết kỹ thuật/ }),
    );
    expect(screen.getByText(/Nguồn dữ liệu trích xuất:/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Ẩn chi tiết kỹ thuật/ }),
    );
    expect(
      screen.queryByText(/Nguồn dữ liệu trích xuất:/),
    ).not.toBeInTheDocument();
  });

  it("allows selecting a specific artifact from message history to inspect", async () => {
    const user = userEvent.setup();
    setDefaultHooks(
      [
        {
          id: 19,
          role: "ASSISTANT",
          action: "PROPOSE_PLAN",
          content: "Kế hoạch trước đó.",
          plan: {
            schemaVersion: 1,
            title: "Kế hoạch cũ",
            objective: "Mục tiêu cũ",
            query: "Truy vấn cũ",
            fromDate: "2026-07-01",
            toDate: "2026-07-31",
            metrics: ["cancellation_rate"],
            groupBy: ["timeslot"],
            sourceViews: ["chatbot_report_appointments_view"],
          },
          report: null,
          createdAt: "2026-07-31T10:00:00Z",
        },
        {
          id: 22,
          role: "ASSISTANT",
          action: "GENERATE_REPORT",
          content: "Báo cáo mới nhất.",
          plan: null,
          report: baseReport,
          createdAt: "2026-08-20T10:00:00Z",
        },
      ],
      true,
    );
    render(<AdminAiReportAssistantPage />);

    // By default, latest artifact (report) is shown
    expect(
      screen.getByRole("button", { name: /Xuất CSV/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Xác nhận và tạo báo cáo" }),
    ).not.toBeInTheDocument();

    // Clicking the plan's anchor in chat switches the artifact workspace to that plan
    await user.click(
      screen.getByRole("button", { name: "Xem chi tiết & duyệt" }),
    );
    expect(
      screen.getByRole("button", { name: "Xác nhận và tạo báo cáo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Kế hoạch cũ")).toBeInTheDocument();
  });

  it("toggles the left conversation sidebar open and closed on desktop", async () => {
    const user = userEvent.setup();
    setDefaultHooks([], true);
    render(<AdminAiReportAssistantPage />);

    // Initially, the collapse button exists in the conversation list header
    const collapseBtn = screen.getByRole("button", {
      name: "Thu gọn danh sách hội thoại",
    });
    expect(collapseBtn).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mở rộng danh sách hội thoại" }),
    ).not.toBeInTheDocument();

    // Click collapse
    await user.click(collapseBtn);

    // Sidebar is hidden, reopen button in chat header is visible
    expect(
      screen.queryByRole("button", { name: "Thu gọn danh sách hội thoại" }),
    ).not.toBeInTheDocument();
    const openBtn = screen.getByRole("button", {
      name: "Mở rộng danh sách hội thoại",
    });
    expect(openBtn).toBeInTheDocument();

    // Click reopen
    await user.click(openBtn);

    // Sidebar is back
    expect(
      screen.getByRole("button", { name: "Thu gọn danh sách hội thoại" }),
    ).toBeInTheDocument();
  });
});
