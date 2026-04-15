import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { symptomArraySchema } from "./symptoms_analyzer.tool.js";

dotenv.config();

const diagnosisSchema = z.object({
  id: z
    .string()
    .min(1, "id is required")
    .describe("ID duy nhất của chẩn đoán bệnh"),
  name: z.string().min(1, "name is required").describe("Tên bệnh"),
  probability: z.number().min(0).max(1).describe("Xác suất dự đoán"),
});

export const diagnosisArraySchema = z.array(diagnosisSchema);

const systemPrompt = `
Bạn là hệ thống hỗ trợ y khoa thông minh.

Nhiệm vụ:
- Dựa vào danh sách các **triệu chứng** đầu vào {symptoms_json},
hãy dự đoán các **bệnh có khả năng mắc phải nhất**.
- Trả về danh sách các bệnh kèm xác suất dự đoán.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    "Dựa trên danh sách triệu chứng sau đây, hãy dự đoán các bệnh có khả năng xảy ra nhất:\n\n{symptoms_json}",
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(diagnosisArraySchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const DiagnosisTool = tool(
  async ({ symptoms }: { symptoms: z.infer<typeof symptomArraySchema> }) => {
    const result = await pipeline.invoke({
      symptoms_json: JSON.stringify(symptoms, null, 2),
    });
    return result;
  },
  {
    name: "diagnosis_tool",
    description:
      "Dự đoán danh sách các bệnh có thể mắc phải dựa vào danh sách triệu chứng đã được phân tích.",
    schema: z.object({
      symptoms: symptomArraySchema.describe(
        "Mảng các triệu chứng đã được trích xuất từ AnalyzeSymptomsTool."
      ),
    }),
  }
);
