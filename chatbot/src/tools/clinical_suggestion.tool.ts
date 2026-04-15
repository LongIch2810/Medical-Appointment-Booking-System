import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { symptomArraySchema } from "./symptoms_analyzer.tool.js";
import { diagnosisArraySchema } from "./diagnosis.tool.js";

dotenv.config();

const suggestionSchema = z.object({
  summary: z
    .string()
    .describe("Tóm tắt nhận định của AI dựa trên bệnh dự đoán"),
  analysis: z.array(
    z.object({
      disease: z.string().describe("Tên bệnh"),
      reason: z
        .string()
        .describe("Lý do AI cho rằng bệnh này có khả năng xảy ra"),
      recommendations: z
        .array(z.string())
        .describe("Đề xuất xét nghiệm hoặc hướng xử lý"),
    })
  ),
});

const systemPrompt = `
Bạn là trợ lý hỗ trợ bác sĩ chuyên nghiệp.

Dữ liệu đầu vào là danh sách các bệnh dự đoán từ hệ thống AI (mỗi bệnh có xác suất dự đoán): {diagnosisArr_json}.
Hãy:
1. Tóm tắt nhận định tổng quan về tình hình bệnh nhân.
2. Phân tích từng bệnh:
   - Giải thích tại sao bệnh đó có khả năng xảy ra (dựa trên triệu chứng thông thường).
   - Gợi ý xét nghiệm hoặc bước tiếp theo mà bác sĩ nên cân nhắc.

Hãy viết bằng ngôn ngữ y khoa ngắn gọn, súc tích, dễ hiểu cho bác sĩ, nhưng có tính chuyên môn.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Dưới đây là danh sách bệnh dự đoán:\n{diagnosisArr_json}"],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(suggestionSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const ClinicalSuggestionTool = tool(
  async ({
    diagnosis,
  }: {
    diagnosis: z.infer<typeof diagnosisArraySchema>;
  }) => {
    const result = await pipeline.invoke({
      diagnosisArr_json: JSON.stringify(diagnosis, null, 2),
    });
    return result;
  },
  {
    name: "clinical_suggestion_tool",
    description:
      "Phân tích và đưa ra gợi ý chuyên môn cho bác sĩ dựa trên kết quả chẩn đoán AI.",
    schema: z.object({
      diagnosis: diagnosisArraySchema.describe(
        "Mảng các bệnh dự đoán từ DiagnosisTool."
      ),
    }),
  }
);
