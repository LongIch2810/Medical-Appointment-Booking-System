import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import adminQaSqlGraph from "../qa_sql/admin_qa_sql.js";

dotenv.config();

const specialtySchema = z.object({
  keywords: z
    .array(z.string())
    .describe(
      "Danh sách các từ khoá, triệu chứng, hoặc tên chuyên khoa trích xuất được."
    ),
});

const systemPrompt = `
Bạn là hệ thống phân tích ngữ cảnh y tế thông minh.
Nhiệm vụ của bạn là trích xuất TẤT CẢ các từ hoặc cụm từ liên quan đến **triệu chứng, bộ phận cơ thể, hoặc tên chuyên khoa y tế** trong văn bản tiếng Việt.

Luật hoạt động:
1. Chỉ trích xuất khi trong câu có các yếu tố y tế thật sự — ví dụ: đau, viêm, sốt, mệt, tim, da, mắt, tai, mũi, họng, dạ dày, nội tiết, thần kinh, v.v.
2. Nếu câu **chỉ mô tả người** (ví dụ: “con gái tôi”, “bé Lan”, “trẻ em”, “mẹ tôi”, “người lớn”, “bố tôi”) mà KHÔNG có triệu chứng hoặc bộ phận cơ thể, thì **kết quả phải là mảng rỗng []**.
3. KHÔNG được tự suy luận chuyên khoa từ đối tượng người (ví dụ: KHÔNG được tự hiểu “trẻ em”, “bé” → “Nhi khoa”).
4. Nếu có từ liên quan đến cơ quan hoặc bệnh, bạn có thể suy luận ra chuyên khoa tương ứng:
   - “da” → “Da Liễu”
   - “mắt” → “Mắt”
   - “đau tim” → “Tim Mạch”
   - “đau đầu” → “Thần Kinh”
5. Kết quả trả về là **một danh sách các từ khoá (array)** liên quan đến y khoa. Không trả về object, không bao gồm từ mô tả người.

Ví dụ:
Input: "Tôi bị đau mắt và chảy nước mắt"  
→ Output: ["Đau Mắt", "Chảy Nước Mắt", "Mắt", "Khoa Mắt"]

Input: "Tôi bị ngứa da và nổi mẩn đỏ"  
→ Output: ["Ngứa Da", "Nổi Mẩn Đỏ", "Da", "Da Liễu"]

Input: "Tôi muốn khám chuyên khoa da liễu"  
→ Output: ["Da", "Da Liễu"]

Input: "Tôi muốn đặt lịch khám cho con gái tôi"  
→ Output: []

Input: "Cho bé Lan đi khám"  
→ Output: []

Input: "Đặt lịch cho mẹ tôi"  
→ Output: []

Chỉ trả về các từ liên quan đến bệnh hoặc chuyên khoa y tế, hoặc [] nếu không có.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  ["human", "Phân tích thông tin tên chuyên khoa từ câu sau: {text_input}"],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(specialtySchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const AnalyzeSpecialtyTool = tool(
  async ({ text_input }: { text_input: string }) => {
    const extractedData = await pipeline.invoke({ text_input });
    const keywords = extractedData.keywords;

    if (!keywords || keywords.length === 0) {
      console.log("[AnalyzeSpecialtyTool] Không tìm thấy từ khoá.");
      return { specialty_names: [] };
    }

    const question = `Dựa vào CSDL, tìm tên chuyên khoa chính xác (duy nhất) 
phù hợp nhất với các từ khoá sau: ${keywords.join(", ")}`;

    console.log(`[AnalyzeSpecialtyTool] Sending to SQL Graph: ${question}`);

    const result = await adminQaSqlGraph.invoke({ question });

    console.log("[AnalyzeSpecialtyTool] Result from SQL Graph:", result);

    const speacialty = JSON.parse(result.result);

    const specialty_names = speacialty.map((s: any) => s.name);

    return { specialty_names };
  },
  {
    name: "analyze_specialty_tool",
    description:
      "Phân tích văn bản (chỉ triệu chứng hoặc tên khoa) để tìm chuyên khoa phù hợp nhất từ CSDL.",
    schema: z.object({
      text_input: z
        .string()
        .describe(
          "Câu mô tả chuyên khoa tiếng Việt, ví dụ 'Tôi muốn khám chuyên khoa nhi.'"
        ),
    }),
  }
);
