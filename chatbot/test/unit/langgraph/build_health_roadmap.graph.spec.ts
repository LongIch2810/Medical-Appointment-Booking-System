import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type Step = "profile" | "metric" | "progress" | "chart" | "plan" | "report" | "render" | "pdf";
type RoadmapStub = {
  calls: Record<Step, unknown[]>;
  results: Record<Step, unknown>;
  errorAt?: Step;
};
const globals = globalThis as typeof globalThis & {
  __ROADMAP_GRAPH_STUB__: RoadmapStub;
};

function resetStub() {
  globals.__ROADMAP_GRAPH_STUB__ = {
    calls: {
      profile: [], metric: [], progress: [], chart: [], plan: [], report: [], render: [], pdf: [],
    },
    results: {
      profile: { fullname: "Patient A" },
      metric: { expectedImprovement: { duration_months: 6 } },
      progress: { labels: ["M1", "M6"] },
      chart: { type: "line", data: { labels: [], datasets: [] } },
      plan: { goals: ["Improve health"] },
      report: { title: "Health roadmap" },
      render: "roadmap-chart.png",
      pdf: { url: "https://cdn.example/roadmap.pdf" },
    },
  };
}
resetStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/langgraph")).href + "/";
const toolModule = (exportName: string, step: Step, name: string) => `
  export const ${exportName} = {
    name: "${name}",
    invoke: async (args) => {
      const state = globalThis.__ROADMAP_GRAPH_STUB__;
      state.calls.${step}.push(args);
      if (state.errorAt === "${step}") {
        const error = new Error("${step} failed");
        error.status = 400;
        throw error;
      }
      return state.results.${step};
    },
  };
`;

registerEsmMocks(subjectDirUrl, {
  "../tools/get_health_profile.tool.js": toolModule("GetHealthProfileTool", "profile", "get_health_profile_tool"),
  "../tools/health_metric_analyzer.too.js": toolModule("HealthMetricAnalyzerTool", "metric", "health_metric_analyzer_tool"),
  "../tools/health_metric_progress.tool.js": toolModule("HealthMetricProgressTool", "progress", "health_metric_progress_tool"),
  "../tools/generate_chat_config.tool.js": toolModule("HealthRoadmapGenerateChartConfigTool", "chart", "generate_chart_config_tool"),
  "../tools/health_plan_generator.tool.js": toolModule("HealthPlanGeneratorTool", "plan", "health_plan_generator_tool"),
  "../tools/write_health_roadmap.tool.js": toolModule("WriteHealthRoadmapTool", "report", "write_health_roadmap_tool"),
  "../utils/renderChartToImage.js": `
    export async function renderChartToImage(args) {
      const state = globalThis.__ROADMAP_GRAPH_STUB__;
      state.calls.render.push(args);
      if (state.errorAt === "render") throw new Error("render failed");
      return state.results.render;
    }
  `,
  "../utils/generatePdfHealthRoadmap.js": `
    export async function generatePdfHealthRoadmap(...args) {
      const state = globalThis.__ROADMAP_GRAPH_STUB__;
      state.calls.pdf.push(args);
      if (state.errorAt === "pdf") throw new Error("pdf failed");
      return state.results.pdf;
    }
  `,
});

const { default: buildHealthRoadmapGraph } = await import(
  "../../../src/langgraph/build_health_roadmap.graph.js"
);

test.beforeEach(resetStub);

const validInput = { request_id: "request-1", relative_id: 7, token: "token" };

test("runs both parallel branches, merges their results, and creates the PDF", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const result = await buildHealthRoadmapGraph.invoke(validInput);
  const stub = globals.__ROADMAP_GRAPH_STUB__;

  assert.equal(result.pdf_url, "https://cdn.example/roadmap.pdf");
  assert.equal(result.final_result?.success, true);
  for (const step of ["profile", "metric", "progress", "chart", "plan", "report", "render", "pdf"] as const) {
    assert.equal(stub.calls[step].length, 1, `${step} was not called once`);
  }
  assert.deepEqual(stub.calls.profile[0], { relative_id: 7, token: "token" });
  assert.deepEqual(stub.calls.chart[0], {
    question: "Lộ trình cải thiện sức khỏe 6 tháng",
    data_json: JSON.stringify(stub.results.progress),
  });
});

test("rejects missing authentication before calling any tool", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const result = await buildHealthRoadmapGraph.invoke({
    request_id: "request-2",
    relative_id: 7,
    token: "",
  });

  assert.equal(result.final_result?.success, false);
  assert.equal(result.final_result?.status, 400);
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.profile.length, 0);
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.metric.length, 0);
});

test("routes a progress-node failure to the final error and skips chart/PDF work", async (t) => {
  t.mock.method(console, "log", () => undefined);
  globals.__ROADMAP_GRAPH_STUB__.errorAt = "progress";

  const result = await buildHealthRoadmapGraph.invoke(validInput);

  assert.equal(result.final_result?.success, false);
  assert.equal(result.errorProgressData?.node, "health_metric_progress_node");
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.chart.length, 0);
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.render.length, 0);
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.pdf.length, 0);
});

test("converts a missing PDF URL into a final node error", async (t) => {
  t.mock.method(console, "log", () => undefined);
  globals.__ROADMAP_GRAPH_STUB__.results.pdf = { url: "" };

  const result = await buildHealthRoadmapGraph.invoke(validInput);

  assert.equal(result.final_result?.success, false);
  assert.equal(result.errorPdf?.node, "create_file_pdf_node");
  assert.equal(globals.__ROADMAP_GRAPH_STUB__.calls.pdf.length, 1);
});
