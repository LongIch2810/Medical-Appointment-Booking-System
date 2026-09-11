import { getChatModel } from "../configs/llm.js";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";

dotenv.config();

const symptomSchema = z.object({
  id: z
    .string()
    .min(1, "id is required")
    .describe("ID duy nhất của chẩn đoán bệnh"),
  symptoms_name: z
    .string()
    .min(1, "symptoms_name is required")
    .describe("Tên triệu chứng"),
});

export const symptomArraySchema = z.array(symptomSchema);

const systemPrompt = `
Bạn là hệ thống trích xuất thông tin các triệu chứng từ văn bản tiếng Việt.

Nhiệm vụ:
- Xác định các triệu chứng dựa vào văn bản đầu vào.
- Chuẩn hóa:
  - Tên bác sĩ: Viết hoa chữ cái đầu tiên của mỗi từ.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Phân tích thông tin tên bác sĩ từ câu sau: {text_input}"],
]);

const model = getChatModel({ profile: "fast", temperature: 0 });

// OpenAI structured output (response_format: json_schema) yêu cầu schema gốc
// phải là object, không được là array — bọc symptomArraySchema vào một object
// tạm ở đây rồi bóc lại bên dưới để giữ nguyên contract trả về (mảng phẳng)
// cho AnalyzeSymptomsTool, tránh phải sửa mọi nơi đang gọi tool này.
const symptomOutputSchema = z.object({ symptoms: symptomArraySchema });

// method: "functionCalling" — xem giải thích ở generate_chat_config.tool.ts.
const structuredModel = model.withStructuredOutput(symptomOutputSchema, {
  method: "functionCalling",
});

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeSymptomsTool = tool(
  async ({ text_input }: { text_input: string }) => {
    const result = await pipeline.invoke({ text_input });
    return result.symptoms;
  },
  {
    name: "analyze_symptoms_tool",
    description: "Phân tích văn bản để xác định các triệu chứng tương ứng.",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả các triệu chứng bằng tiếng Việt, ví dụ 'Tôi bị Ho, sốt cao, đau đầu ,...'"
        ),
    }),
  }
);
