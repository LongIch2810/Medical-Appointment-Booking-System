import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type Step = "sql" | "chart" | "report" | "render" | "pdf";
type ReportStub = {
  calls: Record<Step, unknown[]>;
  results: Record<Step, unknown>;
  errorAt?: Step;
  errorResponse: { status: number; error_detail: string };
};
const globals = globalThis as typeof globalThis & {
  __CREATE_REPORT_GRAPH_STUB__: ReportStub;
};

function resetStub() {
  globals.__CREATE_REPORT_GRAPH_STUB__ = {
    calls: { sql: [], chart: [], report: [], render: [], pdf: [] },
    results: {
      sql: '[{"total":"4","rate":"1.5"}]',
      chart: { type: "bar", data: { labels: [], datasets: [] } },
      report: { title: "Monthly report", sections: [] },
      render: "chart.png",
      pdf: { url: "https://cdn.example/report.pdf" },
    },
    errorResponse: { status: 422, error_detail: "Không thể tạo báo cáo." },
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
      const state = globalThis.__CREATE_REPORT_GRAPH_STUB__;
      state.calls.${step}.push(args);
      if (state.errorAt === "${step}") throw new Error("${step} failed");
      return state.results.${step};
    },
  };
`;

registerEsmMocks(subjectDirUrl, {
  "../tools/admin_qa_sql.tool.js": toolModule("AdminQaSqlTool", "sql", "admin_qa_sql_tool"),
  "../tools/generate_chat_config.tool.js": toolModule(
    "GenerateChartConfigTool",
    "chart",
    "generate_chart_config_tool",
  ),
  "../tools/write_professional_report.tool.js": toolModule(
    "WriteProfessionalReportTool",
    "report",
    "write_professional_report_tool",
  ),
  "../utils/renderChartToImage.js": `
    export async function renderChartToImage(args) {
      const state = globalThis.__CREATE_REPORT_GRAPH_STUB__;
      state.calls.render.push(args);
      if (state.errorAt === "render") throw new Error("render failed");
      return state.results.render;
    }
  `,
  "../utils/generatePdfReport.js": `
    export async function generatePdfReport(...args) {
      const state = globalThis.__CREATE_REPORT_GRAPH_STUB__;
      state.calls.pdf.push(args);
      if (state.errorAt === "pdf") throw new Error("pdf failed");
      return state.results.pdf;
    }
  `,
  "@langchain/core/prompts": `
    export class ChatPromptTemplate {
      static fromMessages() {
        return {
          pipe: () => ({
            invoke: async () => globalThis.__CREATE_REPORT_GRAPH_STUB__.errorResponse,
          }),
        };
      }
    }
  `,
  "../configs/llm.js": `
    export function getChatModel() {
      return { withStructuredOutput: () => ({}) };
    }
  `,
});

const { default: createReportGraph } = await import(
  "../../../src/langgraph/create_report.graph.js"
);

test.beforeEach(resetStub);

test("runs SQL, chart, content, and PDF nodes end to end", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const result = await createReportGraph.invoke({ question: "monthly totals" });
  const stub = globals.__CREATE_REPORT_GRAPH_STUB__;

  assert.equal(result.pdf_url, "https://cdn.example/report.pdf");
  assert.equal(result.final_result?.success, true);
  assert.equal(stub.calls.sql.length, 1);
  assert.deepEqual(stub.calls.chart[0], {
    question: "monthly totals",
    data_json: '[{"total":4,"rate":1.5}]',
  });
  assert.deepEqual(stub.calls.report[0], {
    question: "monthly totals",
    data_json: '[{"total":4,"rate":1.5}]',
  });
  assert.deepEqual(stub.calls.pdf[0], [
    stub.results.report,
    "chart.png",
  ]);
});

test("routes invalid input directly to the friendly error node", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const result = await createReportGraph.invoke({ question: "bad" });

  assert.deepEqual(result.final_result, {
    status: 422,
    success: false,
    message: "Không thể tạo báo cáo.",
  });
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.sql.length, 0);
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.chart.length, 0);
});

test("stops downstream work when chart generation throws", async (t) => {
  t.mock.method(console, "log", () => undefined);
  t.mock.method(console, "error", () => undefined);
  globals.__CREATE_REPORT_GRAPH_STUB__.errorAt = "chart";

  const result = await createReportGraph.invoke({ question: "monthly totals" });

  assert.equal(result.final_result?.success, false);
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.report.length, 0);
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.render.length, 0);
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.pdf.length, 0);
});

test("converts a PDF failure into a final error result", async (t) => {
  t.mock.method(console, "log", () => undefined);
  t.mock.method(console, "error", () => undefined);
  globals.__CREATE_REPORT_GRAPH_STUB__.errorAt = "pdf";

  const result = await createReportGraph.invoke({ question: "monthly totals" });

  assert.equal(result.errorPdf?.node, "create_file_pdf_node");
  assert.equal(result.final_result?.success, false);
  assert.equal(globals.__CREATE_REPORT_GRAPH_STUB__.calls.pdf.length, 1);
});
