import { getChatModel } from "../configs/llm.js";
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

const model = getChatModel({ profile: "quality", temperature: 0 });

// OpenAI structured output (response_format: json_schema) yêu cầu schema gốc
// phải là object, không được là array — bọc diagnosisArraySchema vào một object
// tạm ở đây rồi bóc lại bên dưới để giữ nguyên contract trả về (mảng phẳng)
// cho DiagnosisTool, tránh phải sửa mọi nơi đang gọi tool này.
const diagnosisOutputSchema = z.object({ diagnosis: diagnosisArraySchema });

// method: "functionCalling" — xem giải thích ở generate_chat_config.tool.ts.
const structuredModel = model.withStructuredOutput(diagnosisOutputSchema, {
  method: "functionCalling",
});

const pipeline = promptTemplate.pipe(structuredModel);

export const DiagnosisTool = tool(
  async ({ symptoms }: { symptoms: z.infer<typeof symptomArraySchema> }) => {
    const result = await pipeline.invoke({
      symptoms_json: JSON.stringify(symptoms, null, 2),
    });
    return result.diagnosis;
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
