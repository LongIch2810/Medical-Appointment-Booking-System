import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import bookingGraph from "../langgraph/booking.graph.js";

dotenv.config();

export const bookingAppointmentTool = tool(
  async ({ full_text_input }, runManager) => {
    try {
      const token = runManager?.configurable?.token;
      if (!token)
        return "Bạn chưa đăng nhập. Vui lòng đăng nhập trước khi đặt lịch.";

      const result = await bookingGraph.invoke({
        text_input: full_text_input,
        token,
      });

      console.log("🧩 bookingGraph result:", JSON.stringify(result, null, 2));

      if (!result) return "Không thể xử lý yêu cầu đặt lịch.";

      if (
        result.ambiguous_relatives === true &&
        Array.isArray(result.relatives)
      ) {
        const relativeNames = result.relatives
          .map((r) => `${r.fullname} - ${r.dob}`)
          .join(", ");
        return `Tôi tìm thấy nhiều người thân phù hợp: ${relativeNames}. Bạn vui lòng chỉ định rõ bạn muốn đặt lịch cho ai?`;
      }

      if (Array.isArray(result.missing) && result.missing.length > 0) {
        const fieldLabels: any = {
          selected_relative_id: "Người được đặt khám",
          appointment_date: "ngày khám",
          start_time: "giờ bắt đầu khám",
          end_time: "giờ kết thúc khám",
          selected_specialty_name: "Chuyên khoa đặt khám",
        };
        const readable = result.missing
          .map((f) => `- ${fieldLabels[f] || f}`)
          .join("\n");
        return `Thiếu thông tin để đặt lịch:\n${readable}\n.`;
      }

      const br = result.booking_result;
      if (br) {
        if (typeof br === "string") return br;
        if (br && br.doctor && br.doctor_schedule) {
          const doctorName = br?.doctor?.user?.fullname || "Không xác định";
          const specialty =
            br?.doctor?.specialty?.name || "Chưa rõ chuyên khoa";
          const date = br?.appointment_date || "Không rõ ngày";
          const startTime = br?.doctor_schedule?.start_time || "??:??";
          const endTime = br?.doctor_schedule?.end_time || "??:??";
          const address = br?.doctor?.user?.address || "Chưa cập nhật địa chỉ";
          const phone = br?.doctor?.user?.phone || "Không có số điện thoại";
          const email = br?.doctor?.user?.email || "Không có email";
          const patient =
            result.relatives?.find?.(
              (r) => r.id === result.selected_relative_id
            )?.fullname || "bệnh nhân";

          const bookingMode =
            br?.booking_mode === "ai_select"
              ? "Đặt lịch thông minh (AI hỗ trợ)"
              : "Thủ công";

          return `
                  ĐẶT LỊCH THÀNH CÔNG!

                  Người khám: ${patient}  
                  Bác sĩ: ${doctorName}  
                  Chuyên khoa: ${specialty}  
                  Ngày khám: ${date}  
                  Thời gian: ${startTime} - ${endTime}  
                  Địa chỉ khám: ${address}  
                  Liên hệ: ${phone}  
                  Email: ${email}  

                  Hình thức đặt lịch: ${bookingMode}    
                  ---------------------------------

                  Cảm ơn bạn đã tin tưởng LifeHealth!   
                  Chúc bạn và gia đình nhiều sức khỏe.                 .
                `;
        }
      }
      return "Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.";
    } catch (error) {
      console.error("Lỗi trong bookingAppointmentTool:", error);
      return "Lỗi hệ thống khi đặt lịch. Vui lòng thử lại.";
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
- Tool trả về "ĐẶT LỊCH THÀNH CÔNG".
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
            "mà bạn đã thu thập được từ toàn bộ lịch sử hội thoại. "
        ),
    }),
  }
);
