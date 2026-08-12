import * as dotenv from "dotenv";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getChatModel } from "../configs/llm.js";

dotenv.config();

const medicalLLM = getChatModel({
  profile: "fast",
  temperature: 0.3,
});

export const medicalConsultationTool = tool(
  async ({ question }) => {
    const res = await medicalLLM.invoke(question);
    return res.content;
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
