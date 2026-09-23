import { getChatModel } from "../configs/llm.js";
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
    .describe("Luôn để trống vì các view báo cáo hiện tại không cung cấp dữ liệu kinh tế/tài chính."),
  footer: z.string().describe("Chữ ký hoặc thông tin kết thúc báo cáo."),
});
const systemPrompt = `
Bạn là chuyên gia phân tích dữ liệu vận hành y tế của LifeHealth.

Nhiệm vụ của bạn:
- Viết báo cáo phân tích chuyên sâu và chuyên nghiệp, dựa trên dữ liệu thật.
- Ngôn ngữ: tiếng Việt, phong cách trang trọng, chuẩn doanh nghiệp.
- Cấu trúc rõ ràng gồm: tiêu đề, phân tích, nhận định và khuyến nghị. Trường economic_context luôn là chuỗi rỗng.
- Mọi số liệu, tỷ lệ và chỉ số dẫn xuất phải xuất hiện trong kết quả SQL; không tự tính, ước lượng hoặc suy ra con số mới.
- Nếu dữ liệu không đủ để kết luận, hãy nói rõ giới hạn thay vì suy đoán.
- Không bổ sung bối cảnh kinh tế vĩ mô, tác động tài chính hoặc ngày hiện tại; các view hiện hành không cung cấp dữ liệu đó.
- Không viết lan man, chỉ tập trung vào insight và đề xuất có giá trị.
- Chỉ có text không dùng bất cứ kí tự nào kể cả dấu *.
- Footer:
    - Thương hiệu của là AI LifeHealth
- Phải trả về đúng định dạng JSON theo schema.
`;

// Gộp system + human vào 1 message "human" duy nhất (không tách role
// "system" riêng) — đã xác nhận qua khảo sát: với LLM proxy nội bộ đang
// dùng, cặp system+human kèm withStructuredOutput cho tool này liên tục trả
// về undefined (model không gọi function), trong khi gộp thành 1 human
// message thì hoạt động ổn định. generate_chat_config.tool.ts vẫn tách
// system/human bình thường vì không gặp vấn đề tương tự.
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "human",
    `${systemPrompt}

Câu hỏi yêu cầu phân tích: {question}
Dữ liệu đầu vào (JSON): {data_json}

Hãy viết báo cáo phân tích chuyên nghiệp theo định dạng đã nêu.
{groundingFeedback}
    `,
  ],
]);

const model = getChatModel({
  profile: "quality",
  temperature: 0.3,
  timeoutMs: 90_000,
  totalTimeoutMs: 120_000,
});

// method: "functionCalling" — xem giải thích ở generate_chat_config.tool.ts.
const structuredModel = model.withStructuredOutput(ReportSchema, {
  method: "functionCalling",
});

const pipeline = promptTemplate.pipe(structuredModel);

export const WriteProfessionalReportTool = tool(
  async ({ question, data_json, detailLevel, groundingFeedback }: {
    question: string;
    data_json: string;
    detailLevel?: "BRIEF" | "STANDARD" | "DETAILED";
    groundingFeedback?: string[];
  }) => {
    const reportQuestion = detailLevel && detailLevel !== "STANDARD"
      ? `${question}\nRequested detail level: ${detailLevel}.`
      : question;
    const result = await pipeline.invoke({
      question: reportQuestion,
      data_json,
      groundingFeedback: groundingFeedback?.length
        ? `\nBản trước có các số liệu không xuất hiện trong kết quả SQL: ${groundingFeedback.join(", ")}. Hãy viết lại, bỏ các số liệu đó và mọi nhận định phụ thuộc vào chúng. Chỉ giữ số liệu chép nguyên văn từ dữ liệu SQL; không thay thế bằng phép tính hoặc ước lượng.`
        : "",
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
      detailLevel: z.enum(["BRIEF", "STANDARD", "DETAILED"]).optional(),
      groundingFeedback: z.array(z.string()).optional(),
    }),
  }
);
