import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ChatbotOperationError } from "../../../src/utils/retry.js";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type Step = "agent" | "report" | "roadmap" | "diagnosis" | "summary";
type ServiceStub = {
  calls: Record<Step, unknown[]>;
  results: Record<Step, unknown>;
  errorAt?: Step;
};
const globals = globalThis as typeof globalThis & {
  __CHATBOT_SERVICE_STUB__: ServiceStub;
};

function resetStub() {
  globals.__CHATBOT_SERVICE_STUB__ = {
    calls: { agent: [], report: [], roadmap: [], diagnosis: [], summary: [] },
    results: {
      agent: { messages: [{ content: "agent answer", _getType: () => "ai" }] },
      report: {
        pdf_url: "report.pdf",
        result: "[]",
        report: { title: "Report" },
        chartConfig: { type: "bar" },
      },
      roadmap: { pdf_url: "roadmap.pdf" },
      diagnosis: { answer: "diagnosis answer" },
      summary: { summary: { answer: "summary answer" } },
    },
  };
}
resetStub();

// httpClient.ts wraps axios.create(...) in its own instance, whose
// .post/.get are independent from the top-level `axios` module — mocking
// axios.post/axios.get (as before the keep-alive-agent change) no longer
// intercepts chatbot.service.ts's calls. Mock the httpClient module itself
// instead, delegating to a global stub each test can freely reassign.
type HttpStub = {
  post: (...args: unknown[]) => Promise<unknown>;
  get: (...args: unknown[]) => Promise<unknown>;
};
const httpGlobals = globalThis as typeof globalThis & {
  __CHATBOT_HTTP_STUB__: HttpStub;
};
function resetHttpStub() {
  httpGlobals.__CHATBOT_HTTP_STUB__ = {
    post: async () => ({ data: {} }),
    get: async () => ({ data: { data: [] } }),
  };
}
resetHttpStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/services")).href + "/";
const graphModule = (step: Step, named = false) => `
  const graph = {
    invoke: async (...args) => {
      const state = globalThis.__CHATBOT_SERVICE_STUB__;
      state.calls.${step}.push(args);
      if (state.errorAt === "${step}") {
        const error = new Error("${step} failed");
        error.status = 400;
        throw error;
      }
      return state.results.${step};
    },
  };
  ${named ? "export const summaryMedicalRecordGraph = graph;" : "export default graph;"}
`;

registerEsmMocks(subjectDirUrl, {
  "../agents/agents.js": graphModule("agent"),
  "../langgraph/create_report.graph.js": graphModule("report"),
  "../langgraph/build_health_roadmap.graph.js": graphModule("roadmap"),
  "../langgraph/diagnosis.graph.js": graphModule("diagnosis"),
  "../langgraph/summary_medical_record.graph.js": graphModule("summary", true),
  "../configs/httpClient.js": `
    export default {
      post: (...args) => globalThis.__CHATBOT_HTTP_STUB__.post(...args),
      get: (...args) => globalThis.__CHATBOT_HTTP_STUB__.get(...args),
    };
  `,
});

const services = await import("../../../src/services/chatbot.service.js");

test.beforeEach(() => {
  resetStub();
  resetHttpStub();
  process.env.BACKEND_URL = "http://backend.test";
});

test("handleChatService stores history, invokes the agent, and prefers the booking tool reply", async () => {
  const posts: unknown[][] = [];
  httpGlobals.__CHATBOT_HTTP_STUB__.post = async (...args: unknown[]) => {
    posts.push(args);
    return { data: {} };
  };
  httpGlobals.__CHATBOT_HTTP_STUB__.get = async () => ({
    data: {
      data: [
        { role: "human", content: "hello" },
        { role: "ai", content: "hi" },
      ],
    },
  });
  globals.__CHATBOT_SERVICE_STUB__.results.agent = {
    messages: [
      { content: "normal answer", _getType: () => "ai" },
      {
        content: "booking confirmed",
        name: "booking_appointment_tool",
        _getType: () => "tool",
      },
      { content: "latest answer", _getType: () => "ai" },
    ],
  };

  const result = await services.handleChatService({
    question: "book a visit",
    userId: 7,
    token: "token",
  });

  assert.deepEqual(result, { answer: "booking confirmed" });
  assert.equal(posts.length, 2);
  assert.deepEqual(posts[0][1], {
    userId: 7,
    role: "human",
    content: "book a visit",
  });
  assert.deepEqual(posts[1][1], {
    userId: 7,
    role: "ai",
    content: "booking confirmed",
  });
  const [agentState, config] = globals.__CHATBOT_SERVICE_STUB__.calls.agent[0] as [
    { messages: Array<{ content: unknown }> },
    { configurable: { token: string } },
  ];
  assert.deepEqual(agentState.messages.map((message) => message.content), ["hello", "hi"]);
  assert.equal(config.configurable.token, "token");
});

test("handleChatService falls back to the last AI message", async () => {
  httpGlobals.__CHATBOT_HTTP_STUB__.post = async () => ({ data: {} });
  httpGlobals.__CHATBOT_HTTP_STUB__.get = async () => ({
    data: { data: [{ role: "human", content: "hello" }] },
  });

  const result = await services.handleChatService({
    question: "hello",
    userId: 1,
    token: "token",
  });
  assert.deepEqual(result, { answer: "agent answer" });
});

test("handleChatService normalizes backend failures", async () => {
  httpGlobals.__CHATBOT_HTTP_STUB__.post = async () => {
    throw Object.assign(new Error("bad request"), { status: 400 });
  };

  await assert.rejects(
    services.handleChatService({ question: "hello", userId: 1, token: "token" }),
    (error: unknown) =>
      error instanceof ChatbotOperationError && error.status === 400,
  );
});

test("handleCreateReportService maps successful graph output", async () => {
  const result = await services.handleCreateReportService({ question: "report" });

  assert.deepEqual(result, {
    pdfUrl: "report.pdf",
    raw: {
      result: "[]",
      report: { title: "Report" },
      chartConfig: { type: "bar" },
    },
  });
});

test("handleCreateReportService normalizes a graph-level failure", async (t) => {
  t.mock.method(console, "error", () => undefined);
  globals.__CHATBOT_SERVICE_STUB__.results.report = {
    errorChartConfig: { status: 422, code: "BAD_CHART", message: "bad chart" },
    final_result: { status: 422, success: false, message: "report failed" },
  };

  await assert.rejects(
    services.handleCreateReportService({ question: "report" }),
    (error: unknown) =>
      error instanceof ChatbotOperationError &&
      error.status === 422 &&
      error.code === "BAD_CHART",
  );
});

test("handleBuildHealthRoadMapService returns the PDF and passes a request id", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const result = await services.handleBuildHealthRoadMapService({
    relative_id: 9,
    token: "token",
  });

  assert.deepEqual(result, { pdfUrl: "roadmap.pdf" });
  const [input] = globals.__CHATBOT_SERVICE_STUB__.calls.roadmap[0] as [
    { request_id: string; relative_id: number; token: string },
  ];
  assert.match(input.request_id, /^[0-9a-f-]{36}$/i);
  assert.equal(input.relative_id, 9);
  assert.equal(input.token, "token");
});

test("handleBuildHealthRoadMapService rejects a missing PDF URL", async (t) => {
  t.mock.method(console, "log", () => undefined);
  globals.__CHATBOT_SERVICE_STUB__.results.roadmap = { final_result: { success: true } };

  await assert.rejects(
    services.handleBuildHealthRoadMapService({ relative_id: 9, token: "token" }),
    (error: unknown) =>
      error instanceof ChatbotOperationError && error.status === 500,
  );
});

test("diagnosis and summary services map success and normalize failures", async (t) => {
  t.mock.method(console, "error", () => undefined);
  assert.deepEqual(
    await services.handleDiagnosisService({
      text_input: "headache",
      relative_id: 4,
      token: "token",
    }),
    { answer: "diagnosis answer" },
  );
  assert.equal(
    await services.handleSummaryMedicalRecordService({ imageFiles: [] }),
    "summary answer",
  );

  globals.__CHATBOT_SERVICE_STUB__.errorAt = "diagnosis";
  await assert.rejects(
    services.handleDiagnosisService({
      text_input: "headache",
      relative_id: 4,
      token: "token",
    }),
    (error: unknown) =>
      error instanceof ChatbotOperationError && error.status === 400,
  );
});
