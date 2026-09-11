import assert from "node:assert/strict";
import test from "node:test";
import {
  ChartSchema,
  GenerateChartConfigTool,
  HealthRoadmapGenerateChartConfigTool,
} from "../../../src/tools/generate_chat_config.tool.js";

// ChartSchema is real, independently-testable normalization/defaulting logic
// (Chart.js config shape with zod defaults for options/scales). The tool funcs
// themselves are pure LLM-prompt wiring with no branch logic, so those get a
// smoke test of their static shape only.

test("ChartSchema accepts a minimal bar chart and leaves options undefined when omitted", () => {
  const result = ChartSchema.safeParse({
    type: "bar",
    data: {
      labels: ["Nam", "Nữ"],
      datasets: [{ label: "Người dùng", data: [12, 8] }],
    },
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.options, undefined);
    // scales carries its own top-level default({}) so it is always filled in.
    assert.deepEqual(result.data.scales, {});
  }
});

test("ChartSchema fills in datalabels/plugins defaults once an empty options object is provided", () => {
  const result = ChartSchema.safeParse({
    type: "pie",
    data: {
      labels: ["A", "B"],
      datasets: [{ label: "Tỷ lệ", data: [30, 70] }],
    },
    options: {},
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.options?.plugins?.datalabels, {
      display: true,
      color: "#333",
      align: "center",
      anchor: "center",
    });
  }
});

test("ChartSchema fills in title display/text defaults once an empty title object is provided", () => {
  const result = ChartSchema.safeParse({
    type: "line",
    data: {
      labels: ["T1", "T2"],
      datasets: [{ label: "Doanh thu", data: [1, 2] }],
    },
    options: { plugins: { title: {} } },
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.options?.plugins?.title?.display, true);
    assert.equal(result.data.options?.plugins?.title?.text, "Biểu đồ tổng hợp");
  }
});

test("ChartSchema fills in datalabels defaults once an empty datalabels object is provided", () => {
  const result = ChartSchema.safeParse({
    type: "doughnut",
    data: {
      labels: ["A", "B"],
      datasets: [{ label: "Tỷ lệ", data: [40, 60] }],
    },
    options: { plugins: { datalabels: {} } },
  });
  assert.equal(result.success, true);
  if (result.success) {
    const datalabels = result.data.options?.plugins?.datalabels as any;
    assert.equal(datalabels.display, true);
    assert.equal(datalabels.color, "#333");
    assert.equal(datalabels.align, "center");
    assert.equal(datalabels.anchor, "center");
  }
});

test("ChartSchema accepts scatter datasets shaped as {x,y} points", () => {
  const result = ChartSchema.safeParse({
    type: "scatter",
    data: {
      labels: [],
      datasets: [
        {
          label: "Nhóm tuổi",
          data: [
            { x: 18, y: 5 },
            { x: 25, y: 9 },
          ],
        },
      ],
    },
  });
  assert.equal(result.success, true);
});

test("ChartSchema rejects an unsupported chart type", () => {
  const result = ChartSchema.safeParse({
    type: "radar",
    data: { labels: [], datasets: [] },
  });
  assert.equal(result.success, false);
});

test("ChartSchema rejects data missing required labels/datasets", () => {
  const result = ChartSchema.safeParse({ type: "bar", data: {} });
  assert.equal(result.success, false);
});

test("GenerateChartConfigTool and HealthRoadmapGenerateChartConfigTool are distinct instances sharing the same static shape", () => {
  assert.equal(GenerateChartConfigTool.name, "generate_chart_config_tool");
  assert.equal(HealthRoadmapGenerateChartConfigTool.name, "generate_chart_config_tool");
  assert.notEqual(GenerateChartConfigTool, HealthRoadmapGenerateChartConfigTool);

  const valid = GenerateChartConfigTool.schema.safeParse({
    question: "Thống kê độ tuổi các bác sĩ",
    data_json: "[]",
  });
  assert.equal(valid.success, true);
});
