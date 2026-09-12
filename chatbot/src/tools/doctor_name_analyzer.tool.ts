import { getChatModel } from "../configs/llm.js";
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

const model = getChatModel({ profile: "fast", temperature: 0 });

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
