import * as dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import bookingGraph from "../langgraph/booking.graph.js";
import { formatBookingFailure } from "../utils/bookingFailureMessage.js";
import { formatAnswerTemplate } from "../utils/answerTemplate.js";
import { logSafeError } from "../utils/safeLog.js";

dotenv.config();

/**
 * Định dạng kết quả trả về của bookingGraph thành chuỗi văn bản cuối cùng
 * gửi cho người dùng. Tách riêng khỏi tool() (thay vì viết trực tiếp trong
 * callback) để có thể unit test toàn bộ cây nhánh (ambiguous/lookup-error/
 * missing-field/booking_error/success) mà không cần chạy graph LLM thật —
 * cùng pattern với formatBookingFailure() trong bookingFailureMessage.ts.
 */
export function formatBookingResult(result: any): string {
  if (!result)
    return formatAnswerTemplate({
      summary: "Không thể xử lý yêu cầu đặt lịch.",
      details: "Hệ thống không nhận được phản hồi hợp lệ từ quy trình đặt lịch.",
      note: "Vui lòng thử lại sau ít phút.",
    });

  if (result.ambiguous_relatives === true && Array.isArray(result.relatives)) {
    const relativeNames = result.relatives
      .map((r: any) => `${r.fullname} - ${r.dob}`)
      .join(", ");
    return formatAnswerTemplate({
      summary: "Tìm thấy nhiều người thân phù hợp.",
      details: `Danh sách: ${relativeNames}.`,
      note: "Vui lòng chỉ định rõ bạn muốn đặt lịch cho ai.",
    });
  }

  // Lỗi tra cứu (API người thân / API chuyên khoa) khiến thông tin không
  // resolve được — phải báo là lỗi hệ thống, không phải "thiếu thông tin",
  // vì người dùng thực tế đã cung cấp đủ.
  if (result.relative_lookup_error || result.specialty_resolve_error) {
    const parts: string[] = [];
    if (result.relative_lookup_error) parts.push("tra cứu người thân");
    if (result.specialty_resolve_error) parts.push("tra cứu chuyên khoa");
    return formatAnswerTemplate({
      summary: "Hệ thống đang gặp sự cố.",
      details: `Lỗi khi ${parts.join(" và ")}.`,
      note: "Vui lòng thử lại sau ít phút.",
    });
  }

  if (Array.isArray(result.missing) && result.missing.length > 0) {
    const fieldLabels: any = {
      selected_relative_id: "Người được đặt khám",
      appointment_date: "ngày khám",
      start_time: "giờ bắt đầu khám",
      selected_specialty_name: "Chuyên khoa đặt khám",
      new_relative_fullname: "Họ tên người thân",
      new_relative_dob: "Ngày sinh người thân",
      new_relative_gender: "Giới tính người thân",
    };
    const readable = result.missing
      .map((f: string) => `- ${fieldLabels[f] || f}`)
      .join("\n");
    return formatAnswerTemplate({
      summary: "Cần thêm thông tin để đặt lịch.",
      details: readable,
      note: "Vui lòng cung cấp đầy đủ các thông tin trên.",
    });
  }

  // booking_error: mọi trường hợp đặt lịch THẤT BẠI (chưa đăng nhập, lỗi
  // nghiệp vụ từ backend như trùng lịch, lỗi không xác định) — tách riêng
  // khỏi booking_result để field đó chỉ còn mang object thành công, tránh
  // lẫn lộn kiểu dữ liệu (xem BookingState trong booking.graph.ts).
  if (result.booking_error) {
    return formatBookingFailure(result.booking_error);
  }

  const br = result.booking_result;
  if (br) {
    if (br.doctor && br.doctor_schedule) {
      const doctorName = br?.doctor?.user?.fullname || "Không xác định";
      const specialty = br?.doctor?.specialty?.name || "Chưa rõ chuyên khoa";
      const date = br?.appointment_date || "Không rõ ngày";
      const startTime = br?.doctor_schedule?.start_time || "??:??";
      const endTime = br?.doctor_schedule?.end_time || "??:??";
      const address = br?.doctor?.user?.address || "Chưa cập nhật địa chỉ";
      const phone = br?.doctor?.user?.phone || "Không có số điện thoại";
      const email = br?.doctor?.user?.email || "Không có email";
      // br.patient là nguồn đáng tin cậy nhất (lấy từ appointment vừa
      // tạo) — đúng cho cả trường hợp relative_id có sẵn lẫn trường hợp
      // vừa tự tạo hồ sơ mới qua new_relative_profile.
      const patient =
        br?.patient?.fullname ||
        result.relatives?.find?.(
          (r: any) => r.id === result.selected_relative_id,
        )?.fullname ||
        "bệnh nhân";

      const bookingMode =
        br?.booking_mode === "ai_select"
          ? "Đặt lịch thông minh (AI hỗ trợ)"
          : "Thủ công";

      // Mỗi dòng nội dung PHẢI bắt đầu ở cột 0 (không thụt lề) — theo
      // chuẩn CommonMark, một dòng thụt lề từ 4 dấu cách trở lên bị hiểu
      // là code block (ReactMarkdown render nền tối, font monospace,
      // không wrap chữ), khiến khối text này từng bị vỡ giao diện dù
      // CSS phía frontend hoàn toàn đúng. 2 dấu cách cuối mỗi dòng field
      // là cú pháp Markdown ép xuống dòng trong CÙNG một đoạn văn — thiếu
      // nó, các dòng liền kề (không cách nhau dòng trống) sẽ bị gộp lại
      // thành một câu duy nhất.
      const line = (text: string) => `${text}  `; // 2 trailing space = <br> Markdown
      return formatAnswerTemplate({
        summary: "Đặt lịch khám thành công!",
        details: [
          line(`Người khám: ${patient}`),
          line(`Bác sĩ: ${doctorName}`),
          line(`Chuyên khoa: ${specialty}`),
          line(`Ngày khám: ${date}`),
          line(`Thời gian: ${startTime} - ${endTime}`),
          line(`Địa chỉ khám: ${address}`),
          line(`Liên hệ: ${phone}`),
          `Email: ${email}`,
          "",
          `Hình thức đặt lịch: ${bookingMode}`,
        ].join("\n"),
        note: "Cảm ơn bạn đã tin tưởng LifeHealth! Chúc bạn và gia đình nhiều sức khỏe.",
      });
    }

    // br tồn tại nhưng không đúng shape mong đợi (thiếu doctor/doctor_schedule)
    // — tránh rơi lặng lẽ vào fallback chung chung mất hết ngữ cảnh.
    console.warn("booking_result không đúng định dạng mong đợi");
    return formatAnswerTemplate({
      summary: "Không thể hiển thị chi tiết đặt lịch.",
      details: "Đặt lịch có thể đã được ghi nhận nhưng hệ thống không hiển thị được đầy đủ thông tin.",
      note: "Vui lòng kiểm tra lại trong lịch sử đặt lịch của bạn.",
    });
  }

  // Fallback phòng hờ: về lý thuyết mọi trường hợp relative_not_found_label
  // đều đã được checker_node dẫn qua nhánh missing (hỏi thêm fullname/dob/
  // giới tính) hoặc qua booking_result (đặt lịch thành công với hồ sơ mới
  // tạo) ở trên rồi, nên nhánh này gần như không bao giờ chạy tới trong
  // thực tế — giữ lại chỉ để không im lặng rơi vào lỗi chung chung nếu
  // logic phía trên có thay đổi ngoài dự kiến trong tương lai.
  if (result.relative_not_found_label) {
    return formatAnswerTemplate({
      summary: `Không tìm thấy hồ sơ "${result.relative_not_found_label}".`,
      details: "Không có trong danh sách người thân của bạn.",
      note: "Vui lòng cho tôi biết thêm họ tên, ngày sinh và giới tính, hoặc cho biết muốn đặt lịch cho ai khác.",
    });
  }

  return formatAnswerTemplate({
    summary: "Có lỗi xảy ra khi đặt lịch.",
    details: "Không xác định được nguyên nhân cụ thể.",
    note: "Vui lòng thử lại sau.",
  });
}

export const bookingAppointmentTool = tool(
  async ({ full_text_input }, runManager) => {
    try {
      const token = runManager?.configurable?.token;
      if (!token)
        return formatAnswerTemplate({
          summary: "Bạn chưa đăng nhập.",
          details: "Cần đăng nhập tài khoản để đặt lịch khám.",
          note: "Vui lòng đăng nhập trước khi đặt lịch.",
        });

      const result = await bookingGraph.invoke({
        text_input: full_text_input,
        token,
        proposal_only: true,
      });
      if (result.booking_proposal) {
        return JSON.stringify({
          type: "PATIENT_BOOKING_PROPOSAL",
          // Create this before the outer patient graph checkpoints the tool
          // result. Resuming that checkpoint therefore always uses the same
          // idempotency key.
          operationId: randomUUID(),
          proposal: result.booking_proposal,
        });
      }
      return formatBookingResult(result);
    } catch (error) {
      logSafeError("bookingAppointmentTool failed", error);
      return formatAnswerTemplate({
        summary: "Lỗi hệ thống khi đặt lịch.",
        details: "Có sự cố xảy ra trong quá trình xử lý yêu cầu đặt lịch của bạn.",
        note: "Vui lòng thử lại.",
      });
    }
  },
  {
    name: "booking_appointment_tool",
    description: `
TRÁCH NHIỆM CỐT LÕI CỦA BẠN (LLM): Khi người dùng yêu cầu đặt lịch (ví dụ: "đặt lịch", "khám bệnh"), bạn **PHẢI GỌI TOOL NÀY**.
Nhiệm vụ của bạn **CHỈ LÀ** tổng hợp thông tin, **KHÔNG PHẢI** tự kiểm tra thiếu đủ.

Tool này sẽ tự xử lý logic nghiệp vụ, bao gồm cả việc người dùng chỉ cung cấp 'chuyên khoa' (specialty) **HOẶC** 'bác sĩ' (doctor).

### QUY TẮC QUẢN LÝ PHIÊN (SESSION) - CỰC KỲ QUAN TRỌNG
Một "phiên đặt lịch" (booking session) MỚI bắt đầu khi người dùng nói các câu như:
- "Đặt lịch"
- "Tôi muốn khám"
- "Đặt lịch cho con gái"

Một "phiên đặt lịch" KẾT THÚC khi:
- Tool trả về "Đặt lịch khám thành công!".
- Tool trả về một lỗi nghiệp vụ (ví dụ: "Hết lịch", "Bác sĩ không rảnh").
- Người dùng nói "hủy", "thôi không đặt nữa".

**QUY TẮC VÀNG (BẮT BUỘC TUÂN THỦ):**
**KHI MỘT PHIÊN MỚI BẮT ĐẦU, BẠN (LLM) PHẢI "QUÊN" HẾT THÔNG TIN CỦA PHIÊN CŨ.**
**BẠN CHỈ ĐƯỢC TỔNG HỢP THÔNG TIN TỪ CÁC TIN NHẮN TRONG PHIÊN HIỆN TẠI.**

**VÍ DỤ:**
- **PHIÊN 1:**
- User: "Đặt lịch cho con gái Lan"
- ... (đặt lịch thành công) ...
- **PHIÊN 2 (Sau đó):**
- User: "Giờ tôi muốn đặt lịch cho con gái"
- **HÀNH ĐỘNG SAI (CẤM):** Gọi tool với \`full_text_input: "Đặt lịch cho con gái Lan"\`.
- **HÀNH ĐỘNG ĐÚNG:** Vì đây là PHIÊN MỚI, bạn phải tổng hợp \`full_text_input: "Đặt lịch cho con gái"\`. Tool sẽ tự động phát hiện 'con gái' là mơ hồ và trả về câu hỏi "Bạn muốn chọn ai...?" hoặc "Thiếu thông tin...".

### QUY TẮC TỔNG HỢP \`full_text_input\`:
1.  Chỉ tổng hợp thông tin **TRONG PHIÊN HIỆN TẠI**.
2.  Ưu tiên thông tin mới nếu người dùng sửa đổi (ví dụ: user nói 'bác sĩ A', rồi lại nói 'thôi cho tôi bác sĩ B' -> chỉ dùng 'bác sĩ B').

### CÁCH XỬ LÝ KẾT QUẢ TRẢ VỀ CỦA TOOL:
Tool sẽ trả về một CHUỖI. Bạn (LLM) chỉ cần **LẶP LẠI Y HỆT** chuỗi đó cho người dùng.
**CẤM** tự ý thêm thắt (như 'Tuy nhiên...').
`,
    schema: z.object({
      full_text_input: z
        .string()
        .describe(
          "Một chuỗi vĂN bẢN đầy đủ chứa tất cả thông tin đặt lịch " +
            "mà bạn đã thu thập được từ toàn bộ lịch sử hội thoại. ",
        ),
    }),
  },
);
