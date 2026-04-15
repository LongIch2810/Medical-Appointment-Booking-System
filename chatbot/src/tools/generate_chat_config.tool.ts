import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";

dotenv.config();

export const ChartSchema = z.object({
  type: z.enum(["bar", "line", "pie", "doughnut", "scatter"]),
  data: z.object({
    labels: z.array(z.string()),
    datasets: z.array(
      z.object({
        label: z.string(),
        data: z.union([
          z.array(z.number()),
          z.array(z.object({ x: z.number(), y: z.number() })),
        ]),
        backgroundColor: z.array(z.string()).optional(),
        borderColor: z.string().optional(),
        borderWidth: z.number().optional(),
      })
    ),
  }),
  options: z
    .object({
      plugins: z
        .object({
          title: z
            .object({
              display: z.boolean().optional().default(true),
              text: z.string().optional().default("Biểu đồ tổng hợp"),
            })
            .optional(),
          legend: z
            .object({
              display: z.boolean().optional().default(true),
            })
            .optional(),
        })
        .optional()
        .default({}),
      datalabels: z
        .object({
          display: z.boolean().optional().default(true),
          color: z.string().optional().default("#333"),
          font: z
            .object({
              size: z.number().optional().default(12),
              weight: z.string().optional().default("bold"),
            })
            .optional(),
          align: z
            .enum(["center", "end", "start", "right", "left", "top", "bottom"])
            .optional()
            .default("center"),
          anchor: z
            .enum(["center", "end", "start"])
            .optional()
            .default("center"),
          formatter: z
            .string()
            .optional()
            .describe(
              "LLM chỉ cần mô tả logic: ví dụ 'hiển thị phần trăm' hoặc 'hiển thị giá trị tuyệt đối'."
            ),
        })
        .optional()
        .default({}),
    })
    .optional(),
  scales: z
    .object({
      y: z
        .object({
          beginAtZero: z.boolean().optional().default(true),
        })
        .optional(),
    })
    .optional()
    .default({}),
});

const systemPrompt = `
Bạn là chuyên gia hàng đầu về phân tích dữ liệu và trực quan hóa (Data Visualization Expert).
Nhiệm vụ của bạn:
1. Dựa trên câu hỏi: {question}
2. Dựa trên dữ liệu thật (JSON): {data_json}

Yêu cầu:
- Phân tích kiểu dữ liệu hợp lý (danh mục, số lượng, thời gian, tỷ lệ, v.v.)
- Quyết định loại biểu đồ trực quan phù hợp nhất (bar, line, pie, doughnut, scatter, ...)
- Chọn **bảng màu dễ nhìn, tươi sáng và có độ tương phản cao**, tránh các màu quá tối hoặc trùng nhau.
  Ví dụ: 
  - Sử dụng tone như: rgba(75, 192, 192, 0.6), rgba(255, 159, 64, 0.6), rgba(153, 102, 255, 0.6), rgba(54, 162, 235, 0.6)
  - Mỗi nhóm dữ liệu hoặc phần biểu đồ nên có màu khác nhau.
- Sinh ra cấu hình biểu đồ **chuẩn Chart.js** (type, data, options) theo JSON schema đã định nghĩa.
- Nếu dữ liệu có tỷ lệ phần trăm hoặc cơ cấu, hãy ưu tiên biểu đồ tròn (pie/doughnut) với màu phân biệt rõ.
- Đảm bảo biểu đồ hiển thị đẹp, dễ đọc, chuyên nghiệp như trong báo cáo doanh nghiệp.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    `
Câu hỏi của người dùng: {question}
Dữ liệu thực: {data_json}
Vui lòng sinh cấu hình biểu đồ Chart.js phù hợp.
    `,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(ChartSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const GenerateChartConfigTool = tool(
  async ({ question, data_json }: { question: string; data_json: string }) => {
    const result = await pipeline.invoke({ question, data_json });
    return result;
  },
  {
    name: "generate_chart_config_tool",
    description:
      "Phân tích dữ liệu thực và câu hỏi để sinh ra cấu hình biểu đồ Chart.js phù hợp (bar, line, pie...).",
    schema: z.object({
      question: z
        .string()
        .describe("Câu hỏi, ví dụ: 'Thống kê độ tuổi các bác sĩ'"),
      data_json: z
        .string()
        .describe(
          "Dữ liệu thực tế dưới dạng JSON, ví dụ: [{doctor_age:35, number_of_doctors:2}, ...]"
        ),
    }),
  }
);
