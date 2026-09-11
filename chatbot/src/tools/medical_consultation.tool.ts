import * as dotenv from "dotenv";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "../configs/llm.js";

dotenv.config();

const medicalLLM = getChatModel({
  profile: "quality",
  temperature: 0.3,
});

/**
 * System prompt gửi trực tiếp cho model — trước đây các quy tắc an toàn chỉ
 * nằm trong `description` của tool, thứ mà outer agent đọc để QUYẾT ĐỊNH có
 * gọi tool hay không, KHÔNG bao giờ được model bên trong tool nhìn thấy.
 */
const MEDICAL_SYSTEM_PROMPT = `Bạn là một trợ lý cung cấp thông tin y tế mang tính tham khảo, KHÔNG phải bác sĩ và KHÔNG được thay thế bác sĩ.

Nguyên tắc bắt buộc, không được vi phạm:
- Không đưa ra chẩn đoán chắc chắn. Chỉ cung cấp thông tin tham khảo và luôn khuyến nghị người dùng gặp bác sĩ/chuyên gia y tế để được chẩn đoán và điều trị chính xác.
- Không thay thế cho việc thăm khám, tư vấn hoặc điều trị của bác sĩ.
- Không tự ý đề nghị thay đổi, tăng/giảm liều lượng hoặc ngưng bất kỳ thuốc nào đã được bác sĩ kê đơn. Nếu người dùng hỏi về thuốc đang dùng theo đơn, khuyến nghị họ hỏi lại bác sĩ hoặc dược sĩ đã kê đơn đó.
- Nếu câu hỏi có dấu hiệu của một tình huống khẩn cấp (đau ngực dữ dội, khó thở nghiêm trọng, dấu hiệu đột quỵ, quá liều, ý định tự tử/tự hại, chảy máu nghiêm trọng, sốc phản vệ, v.v.), PHẢI cảnh báo rõ ràng ngay từ đầu câu trả lời và khuyến nghị gọi cấp cứu (115 tại Việt Nam) hoặc đến cơ sở y tế gần nhất NGAY LẬP TỨC.
- Luôn trả lời theo đúng ngôn ngữ của câu hỏi người dùng (tiếng Việt, tiếng Anh, ...).`;

const EMERGENCY_DISCLAIMER =
  "⚠️ Đây có thể là một tình huống khẩn cấp. Vui lòng gọi ngay số cấp cứu 115 hoặc đến cơ sở y tế gần nhất. Thông tin dưới đây chỉ mang tính chất tham khảo:\n\n";

const RED_FLAG_PATTERNS: RegExp[] = [
  // Chest pain / cardiac
  /đau\s*ngực.{0,20}(dữ dội|dai dẳng|đột ngột|nặng|không chịu nổi)/i,
  /\bchest pain\b/i,
  // Breathing difficulty
  /khó thở/i,
  /(difficulty breathing|shortness of breath|can'?t breathe|struggling to breathe)/i,
  // Stroke
  /đột quỵ|méo miệng|liệt (nửa người|một bên|tay|chân)|nói (ngọng|khó) (đột ngột|bất ngờ)/i,
  /\b(stroke|slurred speech|speech (?:is )?slurred|face (?:is )?drooping|one[- ]sided weakness)\b/i,
  // Overdose
  /quá liều/i,
  /\boverdose\b/i,
  // Suicide / self-harm
  /tự tử|tự sát|tự hại|muốn chết|kết thúc (cuộc sống|cuộc đời|mạng sống)/i,
  /\b(suicide|suicidal|kill myself|end my life|want to die|self[- ]harm)\b/i,
  // Severe bleeding / anaphylaxis
  /chảy máu (nhiều|không ngừng|ồ ạt|dữ dội)/i,
  /\b(severe bleeding|heavy bleeding|uncontrolled bleeding)\b/i,
  /sốc phản vệ|phản ứng dị ứng (nặng|nghiêm trọng)/i,
  /\banaphyla(xis|ctic)\b/i,
];

/**
 * Kiểm tra tất định (không qua LLM) các dấu hiệu khẩn cấp trong câu hỏi —
 * lớp bảo vệ bổ sung độc lập với system prompt, để đảm bảo cảnh báo khẩn
 * cấp luôn xuất hiện bất kể model trả lời gì.
 */
export function detectEmergencyRedFlags(text: string): boolean {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text));
}

export const medicalConsultationTool = tool(
  async ({ question }) => {
    const res = await medicalLLM.invoke([
      new SystemMessage(MEDICAL_SYSTEM_PROMPT),
      new HumanMessage(question),
    ]);
    const content =
      typeof res.content === "string" ? res.content : String(res.content);

    return detectEmergencyRedFlags(question)
      ? `${EMERGENCY_DISCLAIMER}${content}`
      : content;
  },
  {
    name: "medical_consultation_tool",
    description: `
Sử dụng công cụ này để cung cấp thông tin tư vấn chung liên quan đến y tế và sức khỏe.
Công cụ được thiết kế để đưa ra các phản hồi mang tính chất tham khảo dựa trên kiến thức y khoa phổ thông, bao gồm các chủ đề như:

- Các triệu chứng phổ biến và những tình trạng có thể gặp
- Thông tin về thuốc không kê đơn hoặc thuốc kê đơn
- Lời khuyên về chăm sóc sức khỏe, lối sống lành mạnh và phòng bệnh
- Giải thích các thuật ngữ hoặc quy trình y tế

Lưu ý: Công cụ này chỉ mang tính chất tham khảo và **không thay thế cho chẩn đoán, điều trị hoặc tư vấn từ bác sĩ chuyên môn**.
Công cụ **không** truy cập vào bất kỳ cơ sở dữ liệu nội bộ hoặc tài liệu của phòng khám.
Đối với các câu hỏi liên quan đến dữ liệu có cấu trúc (ví dụ: số lượng bác sĩ) hoặc chính sách nội bộ, hãy sử dụng công cụ SQL hoặc RAG phù hợp.

Phản hồi sẽ được tạo ra **theo đúng ngôn ngữ của câu hỏi người dùng** (ví dụ: tiếng Việt, tiếng Anh) để đảm bảo rõ ràng và dễ hiểu.

Khi câu hỏi liên quan đến tình trạng nghiêm trọng hoặc chưa rõ ràng, công cụ phải **luôn khuyến nghị người dùng nên đến gặp bác sĩ hoặc chuyên gia y tế có chuyên môn để được chẩn đoán và điều trị chính xác**.
    `,
    schema: z.object({
      question: z.string(),
    }),
  }
);
