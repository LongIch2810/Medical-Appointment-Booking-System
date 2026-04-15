import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";

import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import axios, { AxiosError } from "axios";

dotenv.config();

const relativeCodeSchema = z.object({
  relationship_code: z.string().min(1, "relative_code is required"),
  name: z.string().optional().describe("name is optional"),
});

//Có 2 cách ép kiểu trả về với LLM
//cách 1: Ép kiểu theo từng bước
//tạo cấu trúc output parser từ zod schema
// const outputParser = StructuredOutputParser.fromZodSchema(relativeCodeSchema);

// console.log("=== Output Parser ===");
// console.log(outputParser);

//tạo bản hướng dẫn định dạng để đưa vào prompt
// const getFormatInstructions = outputParser.getFormatInstructions();

// console.log("=== Format Instructions ===");
// console.log(getFormatInstructions);
// console.log("===========================");

const systemPrompt = `
Bạn là hệ thống phân tích mối quan hệ tiếng Việt.
Nhiệm vụ của bạn là phân tích văn bản của người dùng và trả về MỘT mã quan hệ duy nhất dựa trên các quy tắc sau.

Quy tắc:
- Nếu văn bản chứa từ “bé”, hãy phân tích tên ngay sau từ “bé” để xác định giới tính. 
  Ví dụ: “bé Đạt” → tên “Đạt” thường là con trai, “bé Lan” → tên “Lan” thường là con gái.
- Từ chứa liên quan đến mẹ: "mẹ", "má", "mẹ ruột",... => me
- Từ chứa liên quan đến ba: "cha", "ba", "bố", "bố ruột",... => cha
- Từ chứa liên quan đến "con gái", "bé gái",... => con_gai
- Từ chứa liên quan đến "con trai", "bé trai",... => con_trai
- Từ chứa liên quan đến "vợ", "chồng", "ông xã", "bà xã",... => vo_chong
- Từ chứa liên quan đến "ông", "ông ngoại", "ông nội", "ông cố",... => ong
- Từ chứa liên quan đến "bà", "bà ngoại", "bà nội", "bà cố",... => ba
- Từ chứa liên quan đến họ hàng: "dượng", "dì", "cậu", "bác", "chú", "thím",...=> than_nhan_khac
- Nếu không có từ khóa nào khớp => ban_than
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Văn bản cần phân tích: {text_input}"], // Chỉ cần text input ở đây
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(relativeCodeSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeRelativeTool = tool(
  async ({ text_input, token }: { text_input: string; token: string }) => {
    const { relationship_code, name } = await pipeline.invoke({
      text_input,
    });

    const apiUrl =
      process.env.BACKEND_URL +
      `/api/v1/relatives?relationship_code=${relationship_code}${
        name ? `&name=${encodeURIComponent(name)}` : ""
      }`;

    let relatives = [];

    try {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      relatives = response.data?.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("=> Lỗi gọi API:", error.response?.data || error.message);
      } else if (error instanceof Error) {
        console.error("=> Lỗi không xác định:", error.message);
      } else {
        console.error("=> Lỗi không xác định:", error);
      }
    }

    return { relatives };
  },
  {
    name: "analyze_relative_tool",
    description:
      "Phân tích văn bản để xác định mối quan hệ và truy vấn danh sách relativeId tương ứng.",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả người thân tiếng Việt, ví dụ 'Tôi muốn đặt lịch cho bé Lan.'"
        ),
      token: z.string().describe("Token xác thực người dùng"),
    }),
  }
);
