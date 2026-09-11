import assert from "node:assert/strict";
import test from "node:test";
import {
  HealthMetricAnalyzerTool,
  HealthMetricSchema,
} from "../../../src/tools/health_metric_analyzer.too.js";

// HealthMetricSchema is real, independently-testable structural validation for
// the LLM's structured output. HealthMetricAnalyzerTool's own func is pure
// LLM-prompt wiring with no branch logic, so it gets a smoke test only.

const validHealthMetric = {
  bodyComposition: { status: "Thừa cân", interpretation: "Cần giảm cân từ từ." },
  cardiovascular: {
    bloodPressure: "138/88 mmHg - tăng huyết áp độ 1",
    heartRateStatus: "Bình thường",
    cholesterolStatus: "Cận cao",
    riskLevel: "Trung bình",
  },
  metabolic: { glucoseStatus: "Bình thường", riskLevel: "Thấp" },
  lifeStyle: {
    smokingStatus: "Không hút thuốc",
    alcoholStatus: "Thỉnh thoảng",
    exerciseStatus: "Trung bình",
    interpretation: "Cần vận động đều hơn.",
  },
  other: {
    medicalHistorySummary: "Không có bệnh nền đáng chú ý.",
    allergiesSummary: "Không dị ứng.",
    vaccinationStatus: "Đầy đủ.",
  },
  expectedImprovement: {
    duration_months: 6,
    targetSummary: "cải thiện cân nặng và huyết áp",
    motivationNote: "Kiên trì tập luyện sẽ thấy kết quả rõ rệt.",
  },
};

test("HealthMetricSchema accepts a fully-formed health metric analysis", () => {
  const result = HealthMetricSchema.safeParse(validHealthMetric);
  assert.equal(result.success, true);
});

test("HealthMetricSchema rejects a missing nested required field (cardiovascular.riskLevel)", () => {
  const { riskLevel, ...cardiovascularWithoutRisk } = validHealthMetric.cardiovascular;
  const result = HealthMetricSchema.safeParse({
    ...validHealthMetric,
    cardiovascular: cardiovascularWithoutRisk,
  });
  assert.equal(result.success, false);
});

test("HealthMetricSchema rejects a missing top-level required section", () => {
  const { expectedImprovement, ...withoutExpectedImprovement } = validHealthMetric;
  const result = HealthMetricSchema.safeParse(withoutExpectedImprovement);
  assert.equal(result.success, false);
});

test("HealthMetricSchema rejects the wrong type for duration_months", () => {
  const result = HealthMetricSchema.safeParse({
    ...validHealthMetric,
    expectedImprovement: {
      ...validHealthMetric.expectedImprovement,
      duration_months: "6",
    },
  });
  assert.equal(result.success, false);
});

test("HealthMetricAnalyzerTool exposes the expected name, description, and input schema", () => {
  assert.equal(HealthMetricAnalyzerTool.name, "health_metric_analyzer_tool");
  assert.match(HealthMetricAnalyzerTool.description, /hồ sơ sức khỏe/);

  const valid = HealthMetricAnalyzerTool.schema.safeParse({
    health_profile_json: JSON.stringify({ weight: 70, height: 1.7 }),
  });
  assert.equal(valid.success, true);

  const missing = HealthMetricAnalyzerTool.schema.safeParse({});
  assert.equal(missing.success, false);
});
