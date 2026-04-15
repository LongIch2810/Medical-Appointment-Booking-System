import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

export const HealthMetricSchema = z.object({
  bodyComposition: z
    .object({
      status: z
        .string()
        .describe(
          "Tình trạng thành phần cơ thể tổng quát (ví dụ: bình thường, thừa cân, béo phì)"
        ),
      interpretation: z
        .string()
        .describe("Nhận định ngắn gọn về chỉ số BMI và cân nặng"),
    })
    .describe("Phân tích thành phần cơ thể và BMI"),

  cardiovascular: z
    .object({
      bloodPressure: z
        .string()
        .describe("Huyết áp hiện tại và phân độ (normal/elevated/HTN1/HTN2)"),
      heartRateStatus: z
        .string()
        .describe("Trạng thái nhịp tim (chậm, bình thường, nhanh)"),
      cholesterolStatus: z
        .string()
        .describe(
          "Mức cholesterol toàn phần và đánh giá (bình thường, cao, cận cao)"
        ),
      riskLevel: z.string().describe("Mức độ rủi ro tim mạch tổng hợp"),
    })
    .describe("Đánh giá sức khỏe tim mạch"),

  metabolic: z
    .object({
      glucoseStatus: z
        .string()
        .describe(
          "Mức đường huyết và đánh giá (bình thường, tiền tiểu đường, tiểu đường)"
        ),
      riskLevel: z.string().describe("Mức độ rủi ro chuyển hóa tổng hợp"),
    })
    .describe("Phân tích chuyển hóa (đường huyết, lipid, năng lượng)"),

  lifeStyle: z
    .object({
      smokingStatus: z
        .string()
        .describe("Tình trạng hút thuốc (có/không, tần suất)"),
      alcoholStatus: z.string().describe("Tình trạng sử dụng rượu/bia"),
      exerciseStatus: z
        .string()
        .describe("Mức độ vận động thể chất (ít, trung bình, tích cực)"),
      interpretation: z
        .string()
        .describe("Đánh giá tổng quan tác động của lối sống đến sức khỏe"),
    })
    .describe("Phân tích lối sống và hành vi sức khỏe"),

  other: z
    .object({
      medicalHistorySummary: z
        .string()
        .describe("Tóm tắt bệnh nền hoặc tiền sử y khoa đáng chú ý"),
      allergiesSummary: z.string().describe("Tóm tắt dị ứng đã biết"),
      vaccinationStatus: z.string().describe("Tình trạng tiêm chủng hiện tại"),
    })
    .describe("Thông tin y tế bổ sung"),

  expectedImprovement: z
    .object({
      duration_months: z
        .number()
        .describe(
          "Thời gian ước tính (theo tháng) cần thiết để đạt mục tiêu cải thiện sức khỏe tổng thể"
        ),
      targetSummary: z
        .string()
        .describe(
          "Mục tiêu sức khỏe có thể đạt được sau khoảng thời gian này (ví dụ: giảm 5kg, kiểm soát huyết áp, ổn định đường huyết)"
        ),
      motivationNote: z
        .string()
        .describe(
          "Gợi ý hoặc thông điệp động viên khuyến khích người dùng thực hiện kế hoạch"
        ),
    })
    .describe("Dự đoán thời gian và kết quả cải thiện sức khỏe dự kiến"),
});

const systemPrompt = `
Bạn là **Chuyên gia phân tích hồ sơ sức khỏe (Health Analyst AI)** có kiến thức y sinh học và dinh dưỡng học lâm sàng.
Nhiệm vụ của bạn là **tính toán, diễn giải và phân loại** các chỉ số sức khỏe dựa trên dữ liệu hồ sơ bệnh nhân được cung cấp.

Hãy đọc kỹ JSON đầu vào {health_profile_json} và tự động:
1. **Tính toán & phân tích các chỉ số**:
   - BMI = weight_kg / (height_m)^2, sau đó phân loại (thiếu cân, bình thường, thừa cân, béo phì).
   - Huyết áp (SYS/DIA) → phân độ: normal / elevated / tăng huyết áp độ 1 / độ 2.
   - Nhịp tim → đánh giá: chậm, bình thường, nhanh.
   - Đường huyết (mg/dL) → bình thường / tiền đái tháo đường / đái tháo đường.
   - Cholesterol (mg/dL) → bình thường / cận cao / cao.
2. **Phân tích lối sống**: đánh giá tình trạng hút thuốc, uống rượu, tần suất vận động, và đưa ra nhận định tổng quát.
3. **Tổng hợp bệnh nền, dị ứng, tiêm chủng**: mô tả ngắn gọn, dễ hiểu.
4. **Đánh giá mức rủi ro tổng thể** (riskLevel) cho từng nhóm: 
   - bodyComposition → tình trạng cân nặng.
   - cardiovascular → nguy cơ tim mạch.
   - metabolic → nguy cơ chuyển hoá.
   - lifeStyle → tác động của lối sống.
5. **Dự đoán thời gian và kết quả cải thiện sức khỏe**:
   - Dựa trên các chỉ số hiện tại và mức rủi ro, hãy ước lượng **bao nhiêu tháng** người này cần để cải thiện đáng kể sức khỏe (ví dụ: 3 tháng, 6 tháng).
   - Gợi ý **những kết quả cụ thể có thể đạt được** (ví dụ: giảm 5 kg, giảm huyết áp 10 mmHg, hạ glucose về 110 mg/dL).
   - Viết thêm **một lời khích lệ** ngắn gọn (ví dụ: “Chỉ cần kiên trì tập luyện và ăn uống lành mạnh, bạn có thể đạt sức khỏe tốt hơn rõ rệt trong 3 tháng!”).

YÊU CẦU:
- Phản hồi **chính xác, có ngữ nghĩa y học**, dựa trên chuẩn WHO, ADA (American Diabetes Association), và ESC (European Society of Cardiology).
- KHÔNG đưa ra chẩn đoán hay kê đơn thuốc.
- Trả về đúng cấu trúc JSON theo schema **HealthMetricSchema** đã định nghĩa, không thêm hoặc thiếu trường.

Ví dụ cách diễn giải:
- "bloodPressure": "138/88 mmHg - tăng huyết áp độ 1"
- "glucoseStatus": "160 mg/dL - mức cao, gợi ý kiểm soát đường huyết"
- "smokingStatus": "Không hút thuốc"
- "interpretation": "Cân nặng hơi thừa, huyết áp và đường huyết cao nhẹ, cần cải thiện chế độ ăn và tăng vận động."
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  [
    "human",
    "Phân tích dữ liệu hồ sơ sức khỏe của người dùng: {health_profile_json}",
  ],
]);

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(HealthMetricSchema);

const pipeline = promptTemplate.pipe(structuredModel);

export const HealthMetricAnalyzerTool = tool(
  async ({ health_profile_json }: { health_profile_json: string }) => {
    const result = await pipeline.invoke({ health_profile_json });
    return result;
  },
  {
    name: "health_metric_analyzer_tool",
    description:
      "Phân tích, tính toán và diễn giải dữ liệu hồ sơ sức khỏe của người dùng.",
    schema: z.object({
      health_profile_json: z
        .string()
        .describe(
          "Hồ sơ sức khỏe bệnh nhân được cung cấp dựa trên dữ liệu JSON"
        ),
    }),
  }
);
