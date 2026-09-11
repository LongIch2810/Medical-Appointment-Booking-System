import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HealthPlanSchema } from "./health_plan_generator.tool.js";

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

export function buildHealthRoadmapReport(dataJson: string) {
  const healthPlan = HealthPlanSchema.parse(JSON.parse(dataJson));
  const nutrition = healthPlan.nutrition_plan
    .map(
      (phase) =>
        `${phase.week}: ${phase.goals} Bữa sáng: ${phase.meals.breakfast} Bữa trưa: ${phase.meals.lunch} Bữa tối: ${phase.meals.dinner}`,
    )
    .join("\n");
  const exercise = healthPlan.exercise_plan
    .map(
      (phase) =>
        `${phase.week}: ${phase.goals} ${phase.activities.join(" ")}`,
    )
    .join("\n");

  return HealthRoadmapReportSchema.parse({
    title: `Lộ trình cải thiện sức khỏe ${healthPlan.duration_months} tháng`,
    introduction: healthPlan.summary,
    sections: [
      { section_title: "Dinh dưỡng", content: nutrition },
      { section_title: "Vận động", content: exercise },
      {
        section_title: "Lối sống và thói quen",
        content: healthPlan.lifestyle_advice.join(" "),
      },
      {
        section_title: "Theo dõi và đánh giá",
        content: healthPlan.monitoring.join(" "),
      },
    ],
    progress_summary: `Theo dõi tiến độ theo ${healthPlan.nutrition_plan.length} giai đoạn, ưu tiên cải thiện ổn định và an toàn trong ${healthPlan.duration_months} tháng.`,
    motivation:
      "Những thay đổi nhỏ được duy trì đều đặn sẽ tạo nên kết quả bền vững. Hãy điều chỉnh nhịp độ phù hợp với thể trạng của bạn.",
    conclusion:
      "Lộ trình này hỗ trợ xây dựng thói quen lành mạnh, không thay thế chẩn đoán hoặc điều trị của bác sĩ. Hãy tái khám và cập nhật kế hoạch định kỳ.",
    footer: `AI LifeHealth - Ngày lập kế hoạch: ${new Date()
      .toISOString()
      .slice(0, 10)}`,
  });
}

export const WriteHealthRoadmapTool = tool(
  async ({ data_json }: { data_json: string }) => {
    return buildHealthRoadmapReport(data_json);
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
