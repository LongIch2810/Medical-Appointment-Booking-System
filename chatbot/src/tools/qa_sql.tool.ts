import { tool } from "@langchain/core/tools";
import { z } from "zod";
import qaSqlGraph from "../qa_sql/qa_sql.js";
import { logSafeError } from "../utils/safeLog.js";

export const qaSqlTool = tool(
  async ({ question }) => {
    try {
      const finalState = await qaSqlGraph.invoke({ question });
      return finalState.answer;
    } catch (error: any) {
      logSafeError("qaSqlTool failed", error);
      return "Xin lỗi, hiện không thể truy vấn thông tin này. Vui lòng thử lại sau.";
    }
  },
  {
    name: "qa_sql_tool",
    description: `
Sử dụng công cụ này để trả lời các câu hỏi thực tế bằng cách truy vấn trực tiếp cơ sở dữ liệu PostgreSQL của hệ thống y tế. 
Phù hợp với các câu hỏi yêu cầu dữ liệu có cấu trúc như:

- Số lượng bác sĩ, bài viết, hoặc chuyên khoa.
- Danh sách bác sĩ, chuyên khoa hoặc các bài viết y tế.
- Thông tin chi tiết về bác sĩ như kinh nghiệm, nơi làm việc, hoặc chuyên môn.
- Các truy vấn khác có thể được giải đáp bằng dữ liệu dạng bảng có cấu trúc.

**Không** sử dụng công cụ này cho các câu hỏi kiến thức chung, tư vấn, hoặc mang tính chủ quan.

Công cụ sẽ tự động tạo truy vấn SQL từ câu hỏi của người dùng, thực thi trên cơ sở dữ liệu và tóm tắt kết quả trả về.

Phản hồi phải giữ nguyên **ngôn ngữ gốc của câu hỏi người dùng** (ví dụ: tiếng Việt, tiếng Anh).
    `,
    schema: z.object({
      question: z.string(),
    }),
  },
);
