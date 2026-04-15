import { tool } from "@langchain/core/tools";
import { z } from "zod";
import adminQaSqlGraph from "../qa_sql/admin_qa_sql.js";

export const AdminQaSqlTool = tool(
  async ({ question }: { question: string }) => {
    try {
      const result = await adminQaSqlGraph.invoke({
        question,
      });
      return result.result;
    } catch (error: any) {
      console.error("Lỗi khi chạy AdminQaSqlTool:", error);
      return `Lỗi hệ thống: ${error.message}`;
    }
  },
  {
    name: "admin_qa_sql_tool",
    description: `
Công cụ này giúp bạn phân tích dữ liệu từ database bằng SQL.
Nó sẽ:
- Tự sinh câu SQL SELECT hợp lệ từ câu hỏi người dùng.
- Thực thi trên database thật.
- Trả về kết quả dưới dạng JSON (thống kê, danh sách, báo cáo, v.v.).
Ví dụ:
"Thống kê số lượng bác sĩ theo độ tuổi" → SELECT age, COUNT(*) ...
    `,
    schema: z.object({
      question: z
        .string()
        .describe(
          "Câu hỏi của người dùng bằng tiếng Việt, ví dụ: 'Thống kê số lượng bác sĩ theo độ tuổi.'"
        ),
    }),
  }
);
