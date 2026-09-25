import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PatientPromptTemplatesDialog from "@/components/chatbot/PatientPromptTemplatesDialog";

describe("PatientPromptTemplatesDialog component", () => {
  it("renders categories and handles onSendPrompt and onFillPrompt", () => {
    const handleSend = vi.fn();
    const handleFill = vi.fn();
    const handleOpenChange = vi.fn();

    render(
      <PatientPromptTemplatesDialog
        open={true}
        onOpenChange={handleOpenChange}
        onSendPrompt={handleSend}
        onFillPrompt={handleFill}
      />,
    );

    expect(
      screen.getByText("Gợi ý câu hỏi y tế & Hướng dẫn khám"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tư vấn triệu chứng & Sơ cứu"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tìm bác sĩ & Đặt lịch hẹn"),
    ).toBeInTheDocument();

    // Click "Sửa trước khi gửi" on the first prompt
    const fillButtons = screen.getAllByRole("button", {
      name: "Sửa trước khi gửi",
    });
    fireEvent.click(fillButtons[0]);
    expect(handleFill).toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);

    // Re-render and click "Gửi ngay"
    handleOpenChange.mockClear();
    const sendButtons = screen.getAllByRole("button", { name: "Gửi ngay" });
    fireEvent.click(sendButtons[0]);
    expect(handleSend).toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
