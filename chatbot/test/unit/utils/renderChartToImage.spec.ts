import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  normalizeChartConfig,
  renderChartBufferWithFallback,
  renderChartToImage,
} from "../../../src/utils/renderChartToImage.js";

const baseOptions = {
  plugins: {
    datalabels: {
      display: true,
      formatter: "hiển thị phần trăm",
      font: null,
    },
    title: null,
  },
};

const chartConfigs = [
  {
    type: "bar",
    data: {
      labels: ["Nam", "Nữ"],
      datasets: [{ label: "Người dùng", data: [12, 8] }],
    },
    options: baseOptions,
    scales: { y: { beginAtZero: true } },
  },
  {
    type: "doughnut",
    data: {
      labels: ["18-24", "25-34"],
      datasets: [{ label: "Độ tuổi", data: [10, 15] }],
    },
    options: baseOptions,
    scales: { y: null },
  },
  {
    type: "scatter",
    data: {
      labels: [],
      datasets: [
        {
          label: "Nhóm người dùng",
          data: [
            { x: 18, y: 5 },
            { x: 25, y: 9 },
          ],
        },
      ],
    },
    options: baseOptions,
    scales: { y: { beginAtZero: true } },
  },
] as const;

test("normalizes nullable LLM chart options and string formatters", () => {
  const normalized = normalizeChartConfig(chartConfigs[0] as any);

  assert.equal(normalized.options.plugins.title, undefined);
  assert.equal(normalized.options.plugins.datalabels.font, undefined);
  assert.equal(normalized.options.plugins.datalabels.formatter, undefined);
});

test("renders bar, doughnut, and scatter charts", async () => {
  const outputPaths: string[] = [];

  try {
    for (const config of chartConfigs) {
      const outputPath = await renderChartToImage(config as any);
      outputPaths.push(outputPath);
      assert.equal(fs.existsSync(outputPath), true);
      assert.ok(fs.statSync(outputPath).size > 0);
    }
  } finally {
    outputPaths.forEach((outputPath) => fs.rmSync(outputPath, { force: true }));
  }
});

test("retries without datalabels only for a datalabel plugin failure", async () => {
  const calls: boolean[] = [];
  const pluginError = new Error("Cannot read properties of null (reading 'x')");
  pluginError.stack = "chartjs-plugin-datalabels";

  const buffer = await renderChartBufferWithFallback(
    chartConfigs[0] as any,
    async (config) => {
      calls.push(config.options?.plugins?.datalabels?.display !== false);
      if (calls.length === 1) throw pluginError;
      return Buffer.from("fallback-png");
    },
  );

  assert.deepEqual(calls, [true, false]);
  assert.equal(buffer.toString(), "fallback-png");
});

test("does not hide non-datalabel rendering failures", async () => {
  await assert.rejects(
    renderChartBufferWithFallback(chartConfigs[0] as any, async () => {
      throw new Error("Cloud renderer unavailable");
    }),
    /Cloud renderer unavailable/,
  );
});
