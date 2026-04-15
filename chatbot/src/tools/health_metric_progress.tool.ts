import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

export const ProgressDataSchema = z.object({
  labels: z
    .array(z.string())
    .describe("Các mốc thời gian (ví dụ: Tuần 1, Tuần 2, ...)"),
  weight_kg: z.array(z.number()).describe("Cân nặng theo thời gian (kg)"),
  glucose_mgdl: z
    .array(z.number())
    .describe("Mức đường huyết theo thời gian (mg/dL)"),
  cholesterol_mgdl: z
    .array(z.number())
    .optional()
    .describe("Mức cholesterol theo thời gian (mg/dL)"),
  systolic_bp: z
    .array(z.number())
    .optional()
    .describe("Huyết áp tâm thu (SYS) theo thời gian (mmHg)"),
  diastolic_bp: z
    .array(z.number())
    .optional()
    .describe("Huyết áp tâm trương (DIA) theo thời gian (mmHg)"),
});

const systemPrompt = `
Bạn là **Chuyên gia Dự đoán tiến trình sức khỏe (Health Progress Forecaster)**.

Đầu vào là {health_metric_analyzer_json}, đã bao gồm:
- bodyComposition, cardiovascular, metabolic, lifeStyle, other, expectedImprovement

Nhiệm vụ của bạn:
1. Dựa trên thông tin này, **dự đoán tiến trình cải thiện sức khỏe** trong suốt thời gian nêu ở expectedImprovement.duration_months.
2. Sinh ra dữ liệu định lượng (progressData) để vẽ biểu đồ (chart data) cho từng chỉ số:
   - weight_kg (cân nặng)
   - glucose_mgdl (đường huyết)
   - cholesterol_mgdl (cholesterol)
   - systolic_bp (huyết áp tâm thu)
   - diastolic_bp (huyết áp tâm trương)
3. Dữ liệu phải được phân bố theo mốc thời gian logic:
   • labels: ["Tháng 1", "Tháng 2", ...] hoặc ["Tuần 1", "Tuần 2", ...]
   • Mỗi mảng giá trị thể hiện **quá trình cải thiện dần dần** theo hướng tích cực.
   • Không được có biến động phi lý (ví dụ giảm >2kg/tuần hoặc huyết áp giảm đột ngột).

YÊU CẦU:
- Không tính toán lại BMI, huyết áp hay các chỉ số y học — chúng đã có sẵn.
- Chỉ tập trung **mô phỏng sự cải thiện theo thời gian** dựa trên dữ liệu hiện tại và mục tiêu đã cho.
- Mọi giá trị sinh ra phải **thực tế, có cơ sở khoa học**, và tương thích với mục tiêu sức khỏe trong trường "expectedImprovement".
- Trả về JSON duy nhất, tuân thủ đúng schema **ProgressDataSchema**, gồm các trường có sẵn + progressData.

Ví dụ:
Nếu expectedImprovement.duration_months = 6,
thì progressData.labels = ["Tháng 1", "Tháng 2", ..., "Tháng 6"],
và giá trị weight_kg, glucose_mgdl, systolic_bp, ... phải phản ánh xu hướng cải thiện dần đều, đến khi đạt gần mục tiêu.

Chỉ trả về **JSON hợp lệ duy nhất**.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["ai", systemPrompt],
  [
    "human",
    "Dự đoán tiên trình sức khẻ dựa trên: {health_metric_analyzer_json}",
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(ProgressDataSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const HealthMetricProgressTool = tool(
  async ({
    health_metric_analyzer_json,
  }: {
    health_metric_analyzer_json: string;
  }) => {
    const result = await pipeline.invoke({ health_metric_analyzer_json });
    return result;
  },
  {
    name: "health_metric_analyzer_tool",
    description:
      "Sinh ra dữ liệu tiến trình sức khỏe (progressData) để hiển thị biểu đồ dựa trên các chỉ số sức khỏe đã được phân tích. Dự đoán sự thay đổi của cân nặng, huyết áp, đường huyết, cholesterol... theo thời gian nhằm mô phỏng quá trình cải thiện sức khỏe theo mục tiêu đặt ra.",
    schema: z.object({
      health_metric_analyzer_json: z
        .string()
        .describe(
          "Đầu vào là JSON chứa kết quả phân tích sức khỏe chi tiết (HealthMetricSchema), bao gồm các nhóm chỉ số như bodyComposition, cardiovascular, metabolic, lifeStyle, other và expectedImprovement."
        ),
    }),
  }
);
