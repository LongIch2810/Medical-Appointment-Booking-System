import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssistantMessage from "@/components/chatbot/AssistantMessage";
import "@/i18n";

describe("AssistantMessage component", () => {
  it("renders assistant message content, timestamp, and copy button", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <AssistantMessage
        content="Hãy uống đủ nước và nghỉ ngơi hợp lý."
        createdAt="2026-09-26T01:30:00.000Z"
      />,
    );

    expect(screen.getByText("Hãy uống đủ nước và nghỉ ngơi hợp lý.")).toBeInTheDocument();
    expect(screen.getByText(/26\/09/)).toBeInTheDocument();
    const copyBtn = screen.getByRole("button", { name: "Sao chép nội dung lời khuyên" });
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Hãy uống đủ nước và nghỉ ngơi hợp lý.",
    );
    expect(await screen.findByText("Đã chép")).toBeInTheDocument();
  });

  it("renders MedicalAILoading with animation and elapsed time when isTyping is true", () => {
    render(<AssistantMessage content="" isTyping={true} elapsed={7} />);

    expect(screen.getByText("7s")).toBeInTheDocument();
    expect(screen.getByText(/Đang tìm kiếm thông tin bác sĩ/)).toBeInTheDocument();
  });

  it("renders action badges when action is provided", () => {
    const { rerender } = render(
      <AssistantMessage
        content="Vui lòng cho biết thêm triệu chứng."
        action="CLARIFY"
      />,
    );
    expect(screen.getByText("Cần thêm thông tin")).toBeInTheDocument();

    rerender(
      <AssistantMessage
        content="Bạn có muốn đặt lịch khám này không?"
        action="BOOKING_APPROVAL"
      />,
    );
    expect(screen.getByText("Đề xuất lịch khám")).toBeInTheDocument();
  });
});
