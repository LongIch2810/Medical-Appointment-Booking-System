import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const SectionItemSchema = z.object({
  section_title: z
    .string()
    .describe("Tiêu đề mục (ví dụ: Phân tích sức khỏe hiện tại)"),
  content: z.string().describe("Nội dung chi tiết trình bày trong phần đó."),
});

export const HealthRoadmapReportSchema = z.object({
  title: z
    .string()
    .describe(
      "Tiêu đề tổng thể của báo cáo (ví dụ: Lộ trình cải thiện sức khỏe 6 tháng)."
    ),
  introduction: z
    .string()
    .describe(
      "Đoạn mở đầu giới thiệu tổng quan mục tiêu và tình trạng hiện tại."
    ),
  sections: z
    .array(SectionItemSchema)
    .describe(
      "Các phần chính của bản lộ trình (dinh dưỡng, vận động, lối sống, theo dõi)."
    ),
  progress_summary: z
    .string()
    .describe("Tóm tắt tiến trình sức khỏe dự kiến và kết quả mong đợi."),
  motivation: z
    .string()
    .describe("Lời động viên, định hướng tinh thần cho người đọc."),
  conclusion: z.string().describe("Kết luận và lời khuyên tổng thể."),
  footer: z
    .string()
    .describe(
      "Thông tin kết thúc: ngày lập kế hoạch, chữ ký AI Coach hoặc cơ sở y tế."
    ),
});

const today = new Date();
const currentDate = today.toISOString().split("T")[0];

const systemPrompt = `
Bạn là chuyên gia phân tích cấp cao của một công ty tư vấn chiến lược quốc tế và chuyên gia tư vấn dinh dưỡng – thể thao.  
Nhiệm vụ của bạn là **viết bản lộ trình sức khỏe chuyên nghiệp** dựa trên dữ liệu kế hoạch chi tiết (JSON) được cung cấp {data_json}.

Yêu cầu nội dung:
1. Giới thiệu tổng quan (introduction):
   - Tóm tắt tình trạng sức khỏe hiện tại của bệnh nhân (theo HealthPlan).
   - Giải thích ngắn gọn mục tiêu và ý nghĩa của kế hoạch.

2. Các phần chính (sections):
   - Phần 1 – Dinh dưỡng: mô tả cách tổ chức bữa ăn, thay đổi theo tuần, nguyên tắc ăn uống, lưu ý quan trọng.
   - Phần 2 – Vận động: mô tả chương trình luyện tập, cường độ, tần suất và mục tiêu từng giai đoạn.
   - Phần 3 – Lối sống & thói quen:** nhấn mạnh việc ngủ, uống nước, kiểm soát stress, bỏ thuốc lá, hạn chế rượu bia.
   - Phần 4 – Theo dõi & đánh giá:** hướng dẫn người dùng cách ghi lại kết quả (cân nặng, huyết áp, đường huyết, vòng eo...).

3. Tổng kết tiến trình (progress_summary):
   - Mô tả các cột mốc đạt được theo tháng (ví dụ: “Tháng 3: giảm 3kg, huyết áp ổn định…”).

4. Động viên (motivation):
   - Giọng văn tích cực, nhân văn, thể hiện sự đồng hành của AI Health Coach.
   - Gợi ý phương pháp duy trì lâu dài.

5. Kết luận (conclusion):
   - Nhấn mạnh lợi ích khi tuân thủ lộ trình.
   - Khuyến khích tái khám và cập nhật kế hoạch định kỳ.

6. Footer:
    - Thương hiệu của là AI LifeHealth
    - Ngày hiện tại là: ${currentDate}

Phong cách trình bày:
- Chỉ có text không dùng bất cứ kí tự nào kể cả dấu *.
- Giọng văn trang trọng, dễ hiểu, truyền cảm hứng.
- Không sử dụng ngôn ngữ y khoa quá phức tạp.
- Sử dụng tiếng Việt tự nhiên, gần gũi.
- Không chẩn đoán hay kê đơn thuốc.
- Trả về JSON hợp lệ duy nhất theo schema HealthRoadmapReportSchema.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    `
Hãy viết bản lộ trình sức khỏe chuyên nghiệp cho bệnh nhân.
Dữ liệu đầu vào (HealthPlan JSON): {data_json}
    `,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

const structuredModel = model.withStructuredOutput(HealthRoadmapReportSchema);
const pipeline = promptTemplate.pipe(structuredModel);

export const WriteHealthRoadmapTool = tool(
  async ({ data_json }: { data_json: string }) => {
    const result = await pipeline.invoke({ data_json });
    return result;
  },
  {
    name: "write_health_roadmap_tool",
    description:
      "Sinh bản nội dung lộ trình sức khỏe chuyên nghiệp (bao gồm phân tích, kế hoạch, lời khuyên và động viên) để viết vào file PDF dựa trên dữ liệu kế hoạch sức khỏe JSON.",
    schema: z.object({
      data_json: z
        .string()
        .describe(
          "Dữ liệu kế hoạch sức khỏe chi tiết được sinh ra từ HealthPlanGeneratorTool."
        ),
    }),
  }
);
