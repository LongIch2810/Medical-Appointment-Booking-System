import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import { useUserStore } from "@/store/useUserStore";

const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/configs/axios", () => ({ default: axiosMock }));
vi.mock("@/components/chatbot/ChatHeader", () => ({ default: () => <h1>Trợ lý y tế</h1> }));
vi.mock("@/components/chatbot/MedicalDisclaimer", () => ({ default: () => <p>Lưu ý y khoa</p> }));
vi.mock("@/components/chatbot/WelcomeState", () => ({
  default: ({ onQuickAction }: { onQuickAction: (prompt: string) => void }) => (
    <button type="button" onClick={() => onQuickAction("Đặt lịch khám")}>Prompt đặt lịch</button>
  ),
}));
vi.mock("@/components/chatbot/AssistantMessage", () => ({ default: ({ content }: { content: string }) => <p>{content}</p> }));
vi.mock("@/components/chatbot/UserMessage", () => ({ default: ({ content }: { content: string }) => <p>{content}</p> }));
vi.mock("@/components/chatbot/ChatComposer", () => ({
  default: ({ value, onChange, onSend, textareaRef, isPending }: {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    isPending: boolean;
  }) => (
    <div>
      <textarea ref={textareaRef} aria-label="Nhập câu hỏi" value={value} onChange={(event) => onChange(event.target.value)} />
      <button type="button" disabled={isPending} onClick={onSend}>Gửi</button>
    </div>
  ),
}));

import Chatbot from "@/pages/Chatbot";

describe("Patient multi-thread chatbot", () => {
  let conversations: Array<{ id: number; title: string; createdAt: string; updatedAt: string }>;
  let messages: Array<Record<string, unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
    conversations = [];
    messages = [];
    useUserStore.setState({ userInfo: { id: 7 } as never });
    axiosMock.get.mockImplementation(async (url: string) => {
      if (url === "/chat-history/conversations") {
        return { data: { data: { conversations, total: conversations.length, page: 1, limit: 50, totalPages: 1 } } };
      }
      const conversationId = Number(url.split("/").at(-1));
      return {
        data: {
          data: {
            conversation: conversations.find((item) => item.id === conversationId),
            messages: messages.slice(),
            hasMore: false,
            nextBeforeMessageId: null,
          },
        },
      };
    });
    axiosMock.post.mockImplementation(async (url: string, body?: Record<string, unknown>) => {
      if (url === "/chat-history/conversations") {
        const conversation = { id: 31, title: "Cuộc trò chuyện mới", createdAt: "20/09/2026", updatedAt: "20/09/2026" };
        conversations = [conversation];
        return { data: { data: conversation } };
      }
      const userMessage = {
        id: messages.length + 1,
        role: "USER",
        action: null,
        content: body?.message ?? "Xác nhận đặt lịch",
        payload: null,
        appointmentId: null,
        turnId: "test-turn",
        createdAt: "20/09/2026",
      };
      const isApproval = body?.approvalMessageId !== undefined;
      const assistantMessage = isApproval
        ? {
            id: messages.length + 2,
            role: "ASSISTANT",
            action: "BOOKING_CONFIRMED",
            content: "Đặt lịch khám thành công",
            payload: null,
            appointmentId: 88,
            turnId: "test-turn-2",
            createdAt: "20/09/2026",
          }
        : {
            id: messages.length + 2,
            role: "ASSISTANT",
            action: "BOOKING_APPROVAL",
            content: "Kiểm tra lịch hẹn",
            payload: {
              operationId: "4d7f8c38-b3a4-47a0-9cb3-2d7a48ed98e8",
              bookingSummary: {
                patientName: "Nguyễn An",
                createsRelative: false,
                specialtyName: "Nội tổng quát",
                appointmentDate: "2026-09-22",
                startTime: "09:00",
                endTime: "09:30",
              },
            },
            appointmentId: null,
            turnId: "test-turn-1",
            createdAt: "20/09/2026",
          };
      messages = [...messages, userMessage, assistantMessage];
      conversations[0] = { ...conversations[0], title: "Đặt lịch khám", updatedAt: "20/09/2026" };
      return {
        data: {
          data: {
            conversation: conversations[0],
            userMessage,
            assistantMessage,
            appointment: isApproval ? { id: 88 } : null,
          },
        },
      };
    });
  });

  it("creates a thread from a quick prompt and requires an explicit booking approval", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Chatbot />);

    await user.click(await screen.findByRole("button", { name: "Prompt đặt lịch" }));
    await waitFor(() => expect(axiosMock.post).toHaveBeenCalledWith("/chat-history/conversations"));
    await waitFor(() => expect(axiosMock.post).toHaveBeenCalledWith(
      "/chat-history/conversations/31/messages",
      { message: "Đặt lịch khám" },
    ));

    expect(await screen.findByRole("region", { name: "Xác nhận thông tin đặt lịch" })).toBeInTheDocument();
    expect(screen.getByText("Nguyễn An")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đặt lịch" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lịch" }));
    await waitFor(() => expect(axiosMock.post).toHaveBeenCalledWith(
      "/chat-history/conversations/31/messages",
      { approvalMessageId: 2, decision: "APPROVE" },
    ));
    expect(await screen.findByText("Đặt lịch khám thành công")).toBeInTheDocument();
  });
});
