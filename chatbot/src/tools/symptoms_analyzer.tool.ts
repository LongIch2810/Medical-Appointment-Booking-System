import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
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

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(symptomArraySchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeSymptomsTool = tool(
  async ({ text_input }: { text_input: string }) => {
    const result = await pipeline.invoke({ text_input });
    return result;
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
