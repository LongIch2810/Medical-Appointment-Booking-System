import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const HealthPlanSchema = z.object({
  duration_months: z
    .number()
    .describe("Thời gian tổng thể của kế hoạch (tháng)"),
  summary: z.string().describe("Tóm tắt mục tiêu tổng thể của kế hoạch"),
  nutrition_plan: z
    .array(
      z.object({
        week: z
          .string()
          .describe("Giai đoạn kế hoạch, ví dụ: Giai đoạn 1 (Tuần 1-4)"),
        goals: z.string().describe("Mục tiêu dinh dưỡng của giai đoạn"),
        meals: z.object({
          breakfast: z.string(),
          lunch: z.string(),
          dinner: z.string(),
        }),
      })
    )
    .max(4)
    .describe("Tối đa 4 giai đoạn ăn uống, mỗi giai đoạn có ba bữa mẫu"),
  exercise_plan: z
    .array(
      z.object({
        week: z.string(),
        goals: z.string(),
        activities: z.array(z.string()),
      })
    )
    .max(4)
    .describe("Tối đa 4 giai đoạn vận động và thể thao"),
  lifestyle_advice: z
    .array(z.string())
    .describe("Các khuyến nghị về lối sống lành mạnh"),
  monitoring: z
    .array(z.string())
    .describe("Các chỉ số cần theo dõi và kiểm tra định kỳ"),
});

export function buildHealthPlan(healthMetricJson: string) {
  const healthMetric = JSON.parse(healthMetricJson) as {
    expectedImprovement?: { duration_months?: number; targetSummary?: string };
    bodyComposition?: { status?: string; interpretation?: string };
    cardiovascular?: { riskLevel?: string };
    metabolic?: { riskLevel?: string };
    lifeStyle?: { interpretation?: string };
  };
  const requestedMonths = Number(
    healthMetric.expectedImprovement?.duration_months,
  );
  const durationMonths = Number.isFinite(requestedMonths)
    ? Math.min(12, Math.max(1, Math.round(requestedMonths)))
    : 3;
  const phaseCount = Math.min(4, Math.max(1, Math.ceil(durationMonths / 3)));
  const hasElevatedRisk = /cao|thừa|béo|nguy cơ/i.test(
    JSON.stringify(healthMetric),
  );
  const target =
    healthMetric.expectedImprovement?.targetSummary ??
    "cải thiện sức khỏe tổng thể một cách an toàn và bền vững";

  const phases = Array.from({ length: phaseCount }, (_, index) => {
    const startMonth = Math.floor((index * durationMonths) / phaseCount) + 1;
    const endMonth = Math.max(
      startMonth,
      Math.floor(((index + 1) * durationMonths) / phaseCount),
    );
    const label = `Giai đoạn ${index + 1} (Tháng ${startMonth}-${endMonth})`;
    const goal =
      index === 0
        ? "Ổn định thói quen ăn uống, ngủ nghỉ và vận động phù hợp."
        : index === phaseCount - 1
          ? "Duy trì thói quen lành mạnh và đánh giá tiến độ để điều chỉnh."
          : "Tăng dần mức độ tuân thủ kế hoạch theo thể trạng thực tế.";

    return { label, goal };
  });

  return HealthPlanSchema.parse({
    duration_months: durationMonths,
    summary: `Mục tiêu trong ${durationMonths} tháng là ${target}. Kế hoạch được xây dựng từ các chỉ số sức khỏe hiện có và ưu tiên tiến độ an toàn, có thể duy trì lâu dài.`,
    nutrition_plan: phases.map(({ label, goal }) => ({
      week: label,
      goals: goal,
      meals: {
        breakfast: "Yến mạch hoặc ngũ cốc nguyên hạt, trứng và trái cây ít ngọt.",
        lunch: "Một phần đạm nạc, nhiều rau xanh và tinh bột nguyên cám vừa phải.",
        dinner: hasElevatedRisk
          ? "Rau, đạm nạc và hạn chế đồ chiên, đường đơn, ăn trước giờ ngủ 2-3 tiếng."
          : "Rau, đạm nạc và khẩu phần vừa đủ, hạn chế ăn khuya.",
      },
    })),
    exercise_plan: phases.map(({ label, goal }, index) => ({
      week: label,
      goals: goal,
      activities: [
        `Đi bộ nhanh ${20 + index * 5} phút, ít nhất 5 ngày mỗi tuần.`,
        "Kéo giãn nhẹ 10 phút mỗi ngày.",
        index > 0
          ? "Bổ sung 2 buổi bài tập sức mạnh nhẹ mỗi tuần nếu thể trạng cho phép."
          : "Theo dõi nhịp tim và cảm nhận cơ thể khi bắt đầu vận động.",
      ],
    })),
    lifestyle_advice: [
      "Ngủ đều giờ và hướng tới 7-8 giờ mỗi đêm.",
      "Uống đủ nước, ưu tiên nước lọc và hạn chế đồ uống có đường.",
      "Dành thời gian thư giãn, giảm căng thẳng và không hút thuốc.",
      "Không tự ý dùng thuốc hoặc thay đổi điều trị; trao đổi bác sĩ khi có triệu chứng bất thường.",
    ],
    monitoring: [
      "Theo dõi cân nặng hoặc vòng eo mỗi tuần.",
      "Theo dõi huyết áp, đường huyết hoặc chỉ số bác sĩ đã khuyến nghị.",
      "Ghi nhận mức vận động, giấc ngủ và cảm nhận cơ thể.",
      "Đánh giá lại sau mỗi giai đoạn để điều chỉnh cùng nhân viên y tế khi cần.",
    ],
  });
}

export const HealthPlanGeneratorTool = tool(
  async ({
    health_metric_analyzer_json,
  }: {
    health_metric_analyzer_json: string;
  }) => {
    return buildHealthPlan(health_metric_analyzer_json);
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
