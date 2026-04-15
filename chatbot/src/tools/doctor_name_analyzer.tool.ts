import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { nullable, z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";

dotenv.config();

const doctorSchema = z.object({
  doctor_name: z.string().describe("Tên bác sĩ cần được xác định từ văn bản."),
});

const systemPrompt = `
Bạn là hệ thống trích xuất thông tin tên bác sĩ từ văn bản tiếng Việt.

Nhiệm vụ:
- Xác định tên bác sĩ (doctor_name) dựa vào văn bản đầu vào.
- Nếu KHÔNG có tên bác sĩ, hãy trả về '' (không được viết 'Không tìm thấy' hay chuỗi tương tự).
- Chuẩn hóa:
  - Tên bác sĩ: Viết hoa chữ cái đầu tiên của mỗi từ.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Phân tích thông tin tên bác sĩ từ câu sau: {text_input}"],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(doctorSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeDoctorTool = tool(
  async ({ text_input }: { text_input: string }) => {
    const result = await pipeline.invoke({ text_input });
    return result;
  },
  {
    name: "analyze_doctor_name_tool",
    description:
      "Phân tích văn bản tiếng Việt để xác định tên bác sĩ. Nếu không có tên, trả về '' .",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả bác sĩ tiếng Việt, ví dụ 'Tôi muốn đặt lịch với bác sĩ Lan.'"
        ),
    }),
  }
);

// async function runTests() {
//   const testCases = [
//     "Tôi muốn đặt lịch khám với bác sĩ Nguyễn Văn A.",
//     "Cho tôi đặt lịch với bác sĩ Lan khoa nội tổng quát.",
//     "Khám tim với bác sĩ Trần Quốc Khánh.",
//     "Đặt lịch khám với bác sĩ Đỗ Thị Bích.",
//     "Hẹn gặp bác sĩ Lê Văn Minh lúc 9h sáng mai.",
//     "Khám với bác sĩ Ngọc.",
//     "Tôi cần gặp lại bác sĩ điều trị trước, bác sĩ Nguyễn Hữu Đức.",
//     "Tư vấn online với bác sĩ Phạm Thanh Hằng.",
//     "Muốn gặp bác sĩ chuyên khoa tai mũi họng tên Tuấn.",
//     "Tôi muốn gặp bác sĩ điều trị là Nguyễn Thị Mai.",
//   ];

//   for (const [index, text_input] of testCases.entries()) {
//     console.log(`🧩 Test ${index + 1}: "${text_input}"`);
//     try {
//       const result = await AnalyzeDoctorTool.invoke({ text_input });
//       console.log("✅ Kết quả:", result, "\n");
//     } catch (err) {
//       console.error("❌ Lỗi khi xử lý:", err);
//     }
//   }
// }

// runTests();
