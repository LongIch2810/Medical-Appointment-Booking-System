import { tool } from "@langchain/core/tools";
import { z } from "zod";
import ragGraph from "../rag/rag.js";
import { logSafeError } from "../utils/safeLog.js";

export const ragTool = tool(
  async ({ question }) => {
    try {
      const result = await ragGraph.invoke({ question });
      return result.answer;
    } catch (error: any) {
      logSafeError("ragTool failed", error);
      return "Xin lỗi, hiện không thể truy xuất thông tin này. Vui lòng thử lại sau.";
    }
  },

  {
    name: "rag_tool",
    description: `
Sử dụng công cụ này để trả lời các câu hỏi liên quan đến hoạt động của phòng khám, bao gồm quy định nội bộ, quy trình và các dịch vụ y tế hiện có. 
Công cụ sẽ truy xuất và tóm tắt thông tin liên quan từ các tài liệu nội bộ được lưu trữ trong cơ sở dữ liệu vector thông qua kỹ thuật RAG (Truy xuất kết hợp sinh văn bản).

Công cụ này phù hợp để:
- Trả lời câu hỏi về chính sách, hướng dẫn dịch vụ của phòng khám.
- Cung cấp thông tin từ tài liệu onboarding hoặc tài liệu nội bộ.
- Làm rõ quy trình, vai trò, hoặc quy định trong tổ chức.

Không sử dụng công cụ này cho các câu hỏi kiến thức chung, thống kê cơ sở dữ liệu, hoặc truy vấn dữ liệu có cấu trúc — hãy sử dụng công cụ SQL phù hợp trong những trường hợp đó.

Phản hồi sẽ được tự động tạo ra bằng chính ngôn ngữ của câu hỏi người dùng (ví dụ: tiếng Việt, tiếng Anh, v.v...) để đảm bảo giao tiếp tự nhiên và nhất quán.
`,
    schema: z.object({
      question: z
        .string()
        .describe(
          "Câu hỏi của người dùng liên quan đến dịch vụ y tế hoặc quy định nội bộ."
        ),
    }),
  }
);
