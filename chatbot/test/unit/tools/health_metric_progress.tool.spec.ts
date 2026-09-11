import assert from "node:assert/strict";
import test from "node:test";
import {
  HealthMetricProgressTool,
  ProgressDataSchema,
} from "../../../src/tools/health_metric_progress.tool.js";

// ProgressDataSchema is real, independently-testable structural validation for
// the LLM's structured output (required vs. optional time-series fields).
// HealthMetricProgressTool's own func is pure LLM-prompt wiring with no branch
// logic, so it gets a smoke test only.

test("ProgressDataSchema accepts the minimal required time-series fields", () => {
  const result = ProgressDataSchema.safeParse({
    labels: ["Tháng 1", "Tháng 2"],
    weight_kg: [70, 68],
    glucose_mgdl: [110, 105],
  });
  assert.equal(result.success, true);
});

test("ProgressDataSchema accepts the optional cholesterol/blood-pressure series when provided", () => {
  const result = ProgressDataSchema.safeParse({
    labels: ["Tháng 1", "Tháng 2"],
    weight_kg: [70, 68],
    glucose_mgdl: [110, 105],
    cholesterol_mgdl: [200, 190],
    systolic_bp: [138, 130],
    diastolic_bp: [88, 84],
  });
  assert.equal(result.success, true);
});

test("ProgressDataSchema rejects a missing required series (glucose_mgdl)", () => {
  const result = ProgressDataSchema.safeParse({
    labels: ["Tháng 1", "Tháng 2"],
    weight_kg: [70, 68],
  });
  assert.equal(result.success, false);
});

test("ProgressDataSchema rejects a wrongly-typed series entry", () => {
  const result = ProgressDataSchema.safeParse({
    labels: ["Tháng 1"],
    weight_kg: ["70"],
    glucose_mgdl: [110],
  });
  assert.equal(result.success, false);
});

test("HealthMetricProgressTool exposes the expected name, description, and input schema", () => {
  // Note: this tool's internal name is "health_metric_analyzer_tool", which is
  // identical to HealthMetricAnalyzerTool's name in health_metric_analyzer.too.ts —
  // a pre-existing naming collision in production code, left as-is per scope
  // (not fixing production bugs), just documented here.
  assert.equal(HealthMetricProgressTool.name, "health_metric_analyzer_tool");
  assert.match(HealthMetricProgressTool.description, /tiến trình sức khỏe/);

  const valid = HealthMetricProgressTool.schema.safeParse({
    health_metric_analyzer_json: JSON.stringify({ duration_months: 6 }),
  });
  assert.equal(valid.success, true);

  const missing = HealthMetricProgressTool.schema.safeParse({});
  assert.equal(missing.success, false);
});
