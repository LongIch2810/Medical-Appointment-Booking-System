import assert from "node:assert/strict";
import test from "node:test";
import { buildHealthPlan } from "../../../src/tools/health_plan_generator.tool.js";
import {
  buildHealthRoadmapReport,
  HealthRoadmapReportSchema,
} from "../../../src/tools/write_health_roadmap.tool.js";

const healthMetric = {
  bodyComposition: { status: "Thừa cân", interpretation: "Cần giảm cân từ từ." },
  cardiovascular: { riskLevel: "Trung bình" },
  metabolic: { riskLevel: "Thấp" },
  lifeStyle: { interpretation: "Cần vận động đều hơn." },
  expectedImprovement: {
    duration_months: 9,
    targetSummary: "cải thiện cân nặng và giấc ngủ",
  },
};

test("builds a compact health plan from analyzed health metrics", () => {
  const plan = buildHealthPlan(JSON.stringify(healthMetric));

  assert.equal(plan.duration_months, 9);
  assert.equal(plan.nutrition_plan.length, 3);
  assert.equal(plan.exercise_plan.length, 3);
  assert.ok(plan.nutrition_plan.length <= 4);
  assert.ok(plan.exercise_plan.length <= 4);
});

test("builds a PDF-ready roadmap report without another LLM request", () => {
  const plan = buildHealthPlan(JSON.stringify(healthMetric));
  const report = buildHealthRoadmapReport(JSON.stringify(plan));

  assert.equal(HealthRoadmapReportSchema.safeParse(report).success, true);
  assert.equal(report.sections.length, 4);
  assert.match(report.title, /9 tháng/);
});

