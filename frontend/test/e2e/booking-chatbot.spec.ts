import { test, expect } from "@playwright/test";
import { SEED_SPECIALTY_NAME } from "./fixtures/testData";

// Test tích hợp thật với LLM + LangGraph (chatbot/src/langgraph/booking.graph.ts)
// — KHÔNG mock backend. Vì vậy độ trễ cao (nhiều lượt gọi LLM/round-trip) và
// không hoàn toàn deterministic dù model chạy temperature: 0. Timeout dài +
// retries: 1 đã cấu hình riêng cho project "booking-chatbot" trong
// playwright.config.ts. Nếu cần 1 bộ test UI-chatbot thuần túy nhanh/ổn định
// (không phụ thuộc LLM thật), nên tách riêng 1 spec mock
// POST /chat-history/chat qua page.route().
test.describe("Đặt lịch qua Chatbot", () => {
  test("hỏi lại thông tin còn thiếu, sau đó đặt lịch thành công khi đủ dữ liệu", async ({
    page,
  }) => {
    await page.goto("/chatbot");

    const messageInput = page.getByPlaceholder("Aa");

    // Bước 1: yêu cầu đặt lịch cho "bố" — chưa có hồ sơ thân nhân này, và
    // hoàn toàn chưa có ngày sinh/giới tính/chuyên khoa/giờ khám. Backend
    // (AppointmentsService + BodyCreateAppointmentDto) không được phép bịa
    // các field này — checker_node phải liệt kê ra để hỏi lại.
    await messageInput.fill("Tôi muốn đặt lịch khám cho bố tôi");
    await messageInput.press("Enter");

    // fieldLabels trong chatbot/src/tools/booking_appointment.tool.ts:
    // "Họ tên người thân" / "Ngày sinh người thân" / "Giới tính người thân",
    // hoặc câu mở "Thiếu thông tin để đặt lịch:" — bất kỳ dấu hiệu nào trong
    // số này đều xác nhận chatbot đang hỏi lại thay vì tự bịa dữ liệu.
    const missingInfoPattern =
      /Thiếu thông tin để đặt lịch|Họ tên người thân|Ngày sinh người thân|Giới tính người thân/;
    await expect(page.getByText(missingInfoPattern).first()).toBeVisible({
      timeout: 45_000,
    });

    // Bước 2: bổ sung đầy đủ thông tin còn thiếu trong cùng 1 câu.
    await messageInput.fill(
      `Bố tôi tên Nguyễn Văn Bảy, sinh ngày 10/05/1980, giới tính nam, ` +
        `khám chuyên khoa ${SEED_SPECIALTY_NAME} lúc 8 giờ sáng ngày mai`
    );
    await messageInput.press("Enter");

    // booking_appointment.tool.ts trả cứng chuỗi "ĐẶT LỊCH THÀNH CÔNG!" khi
    // AppointmentsService tạo lịch hẹn thành công (bao gồm cả trường hợp vừa
    // tự tạo Relative + HealthProfile mới cho "bố" qua new_relative_profile).
    // .last() vì tài khoản test dùng chung DB dev không reset giữa các lần
    // chạy — lịch sử chat có thể đã tích luỹ nhiều tin nhắn đặt lịch thành
    // công từ trước, nên chỉ tin nhắn MỚI NHẤT mới thật sự xác nhận kết quả
    // của lượt chạy này.
    await expect(page.getByText("ĐẶT LỊCH THÀNH CÔNG").last()).toBeVisible({
      timeout: 90_000,
    });
  });
});
