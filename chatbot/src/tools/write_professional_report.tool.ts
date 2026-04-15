import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";

dotenv.config();

const AnalysisItemSchema = z.object({
  section_title: z.string().describe("Tiêu đề của phần phân tích."),
  content: z.string().describe("Nội dung chi tiết của phần phân tích."),
});

export const ReportSchema = z.object({
  title: z.string().describe("Tiêu đề tổng thể của báo cáo."),
  analysis: z.array(AnalysisItemSchema).describe("Các phần phân tích chính."),
  insights: z
    .array(z.string())
    .describe("Danh sách nhận định rút ra từ dữ liệu."),
  strategic_recommendations: z
    .array(z.string())
    .describe("Các khuyến nghị chiến lược hoặc hướng hành động."),
  economic_context: z
    .string()
    .describe("Góc nhìn kinh tế vĩ mô hoặc tác động tài chính liên quan."),
  footer: z.string().describe("Chữ ký hoặc thông tin kết thúc báo cáo."),
});
const today = new Date();
const currentDate = today.toISOString().split("T")[0];
const systemPrompt = `
Bạn là chuyên gia phân tích cấp cao của một công ty tư vấn chiến lược quốc tế (McKinsey, PwC, Deloitte...).

Nhiệm vụ của bạn:
- Viết báo cáo phân tích chuyên sâu và chuyên nghiệp, dựa trên dữ liệu thật.
- Ngôn ngữ: tiếng Việt, phong cách trang trọng, chuẩn doanh nghiệp.
- Cấu trúc rõ ràng gồm: tiêu đề, phân tích, nhận định, khuyến nghị, và bối cảnh kinh tế.
- Nội dung phải sâu sắc, thể hiện tầm nhìn chiến lược và hiểu biết kinh tế vĩ mô.
- Không viết lan man, chỉ tập trung vào insight và đề xuất có giá trị.
- Chỉ có text không dùng bất cứ kí tự nào kể cả dấu *.
- Footer:
    - Thương hiệu của là AI LifeHealth
    - Ngày hiện tại là: ${currentDate}
- Phải trả về đúng định dạng JSON theo schema.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    `
Câu hỏi yêu cầu phân tích: {question}
Dữ liệu đầu vào (JSON): {data_json}

Hãy viết báo cáo phân tích chuyên nghiệp theo định dạng đã nêu.
    `,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

const structuredModel = model.withStructuredOutput(ReportSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const WriteProfessionalReportTool = tool(
  async ({ question, data_json }: { question: string; data_json: string }) => {
    const result = await pipeline.invoke({
      question,
      data_json,
    });
    return result;
  },
  {
    name: "write_professional_report_tool",
    description:
      "Sinh báo cáo phân tích chuyên nghiệp (theo phong cách doanh nghiệp lớn) dựa trên dữ liệu JSON và câu hỏi yêu cầu.",
    schema: z.object({
      question: z
        .string()
        .describe(
          "Câu hỏi yêu cầu phân tích, ví dụ: 'Phân tích cơ cấu độ tuổi của bác sĩ theo tháng 10/2025'"
        ),
      data_json: z
        .string()
        .describe(
          "Dữ liệu thực tế dạng JSON, ví dụ: [{doctor_age: 35, number_of_doctors: 2}, ...]"
        ),
    }),
  }
);
