import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

export const HealthPlanSchema = z.object({
  duration_months: z
    .number()
    .describe("Thời gian tổng thể của kế hoạch (tháng)"),
  summary: z.string().describe("Tóm tắt mục tiêu tổng thể của kế hoạch"),
  nutrition_plan: z
    .array(
      z.object({
        week: z.string().describe("Tuần thứ mấy trong kế hoạch"),
        goals: z.string().describe("Mục tiêu dinh dưỡng của tuần"),
        meals: z.object({
          breakfast: z.string(),
          lunch: z.string(),
          dinner: z.string(),
        }),
      })
    )
    .describe("Lộ trình ăn uống chi tiết theo tuần (ăn sáng/trưa/tối)"),
  exercise_plan: z
    .array(
      z.object({
        week: z.string(),
        goals: z.string(),
        activities: z.array(z.string()),
      })
    )
    .describe("Kế hoạch vận động & thể thao chi tiết theo tuần"),
  lifestyle_advice: z
    .array(z.string())
    .describe("Các khuyến nghị về lối sống lành mạnh"),
  monitoring: z
    .array(z.string())
    .describe("Các chỉ số cần theo dõi và kiểm tra định kỳ"),
});

const systemPrompt = `
Bạn là **Chuyên gia dinh dưỡng và chăm sóc sức khỏe nhiều kinh nghiệm** có chuyên môn về dinh dưỡng, thể thao và y học lối sống.  
Đầu vào là JSON {health_metric_analyzer_json} — chứa các thông tin phân tích sức khỏe đã được đánh giá, bao gồm:
- bodyComposition (tình trạng cân nặng, BMI)
- cardiovascular (tim mạch, huyết áp, cholesterol)
- metabolic (đường huyết, chuyển hóa)
- lifeStyle (hút thuốc, rượu, vận động)
- other (bệnh nền, dị ứng, tiêm chủng)
- expectedImprovement (thời gian và mục tiêu cải thiện)

**Nhiệm vụ của bạn:**
Tạo một **kế hoạch cải thiện sức khỏe cá nhân hóa** trong suốt khoảng thời gian "expectedImprovement.duration_months", bao gồm:
1. **Tóm tắt mục tiêu tổng thể (summary)**: Nêu rõ bạn sẽ đạt được gì sau kế hoạch này.
2. **Nutrition plan** – kế hoạch ăn uống:
   - Chia theo từng tuần (Tuần 1, Tuần 2, ...).
   - Gồm 3 bữa chính: sáng, trưa, tối.
   - Dựa vào tình trạng sức khỏe: ví dụ thừa cân → giảm tinh bột nhanh, tăng rau xanh; đường huyết cao → hạn chế đường đơn, tăng ngũ cốc nguyên hạt.
   - Mỗi tuần có mục tiêu riêng (giảm 0.5-1kg, ổn định glucose, v.v.).
3. **Exercise plan** – kế hoạch vận động:
   - Từng tuần có mục tiêu và danh sách hoạt động (ví dụ: đi bộ nhanh, đạp xe, yoga, cardio nhẹ).
   - Tăng dần cường độ theo tháng nhưng không quá sức.
4. **Lifestyle advice** – lời khuyên lối sống:
   - Giấc ngủ, uống nước, kiểm soát stress, giảm rượu bia, không hút thuốc.
5. **Monitoring** – các chỉ số cần theo dõi:
   - Ví dụ: cân nặng hàng tuần, huyết áp, đường huyết buổi sáng, nhịp tim khi nghỉ.

**Nguyên tắc:**
- Dựa trên hướng dẫn WHO, ADA, ESC.
- Không chẩn đoán hay kê đơn thuốc.
- Dùng ngôn ngữ thân thiện, động viên (dùng “bạn” thay vì “bệnh nhân”).
- Số liệu phải thực tế, an toàn, phù hợp với thời gian cải thiện.
- Mỗi kế hoạch **phải có tiến trình cụ thể theo tuần**, không chỉ mô tả chung.

Ví dụ cách diễn đạt:
- "Tuần 1": "Ổn định nhịp sinh học, bắt đầu giảm tinh bột nhanh."
- "breakfast": "Yến mạch + trứng luộc + 1 quả chuối nhỏ"
- "activities": ["Đi bộ nhanh 30 phút mỗi ngày", "Kéo giãn cơ 10 phút buổi sáng"]
- "lifestyle_advice": ["Ngủ đủ 7 tiếng mỗi đêm", "Uống ít nhất 2 lít nước/ngày"]

Chỉ trả về **JSON hợp lệ duy nhất**, không giải thích thêm.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["ai", systemPrompt],
  [
    "human",
    "Tạo kế hoạch cải thiện sức khỏe cơ bản cho bệnh nhân: {health_metric_analyzer_json}",
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(HealthPlanSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const HealthPlanGeneratorTool = tool(
  async ({
    health_metric_analyzer_json,
  }: {
    health_metric_analyzer_json: string;
  }) => {
    const result = await pipeline.invoke({ health_metric_analyzer_json });
    return result;
  },
  {
    name: "health_plan_generator_tool",
    description: "Tạo kế hoạch cải thiện sức khỏe cơ bản cho bệnh nhân.",
    schema: z.object({
      health_metric_analyzer_json: z
        .string()
        .describe(
          "Đầu vào là JSON chứa kết quả phân tích sức khỏe chi tiết (HealthMetricSchema), bao gồm các nhóm chỉ số như bodyComposition, cardiovascular, metabolic, lifeStyle, other và expectedImprovement."
        ),
    }),
  }
);
