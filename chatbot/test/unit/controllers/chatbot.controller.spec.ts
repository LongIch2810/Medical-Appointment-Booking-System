import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type ServiceName =
  | "chat"
  | "report"
  | "roadmap"
  | "diagnosis"
  | "summary";

type ControllerStub = {
  calls: Record<ServiceName, unknown[]>;
  results: Record<ServiceName, unknown>;
  errors: Partial<Record<ServiceName, unknown>>;
};

const globals = globalThis as typeof globalThis & {
  __CHATBOT_CONTROLLER_STUB__: ControllerStub;
};

globals.__CHATBOT_CONTROLLER_STUB__ = {
  calls: { chat: [], report: [], roadmap: [], diagnosis: [], summary: [] },
  results: {
    chat: { answer: "chat answer" },
    report: { pdfUrl: "report.pdf" },
    roadmap: { pdfUrl: "roadmap.pdf" },
    diagnosis: { answer: "diagnosis answer" },
    summary: "summary answer",
  },
  errors: {},
};

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/controllers")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../services/chatbot.service.js": `
    const invoke = async (name, args) => {
      const state = globalThis.__CHATBOT_CONTROLLER_STUB__;
      state.calls[name].push(args);
      if (name in state.errors) throw state.errors[name];
      return state.results[name];
    };
    export const handleChatService = (args) => invoke("chat", args);
    export const handleCreateReportService = (args) => invoke("report", args);
    export const handleBuildHealthRoadMapService = (args) => invoke("roadmap", args);
    export const handleDiagnosisService = (args) => invoke("diagnosis", args);
    export const handleSummaryMedicalRecordService = (args) => invoke("summary", args);
  `,
});

const controllers = await import("../../../src/controllers/chatbot.controller.js");

function resetStub() {
  const stub = globals.__CHATBOT_CONTROLLER_STUB__;
  for (const calls of Object.values(stub.calls)) calls.length = 0;
  stub.errors = {};
}

function createResponse() {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      state.status = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  };
  return { response, state };
}

test.beforeEach(resetStub);

test("handleChatController validates input without calling the service", async () => {
  for (const body of [
    { question: " ", userId: 1, token: "token" },
    { question: "hello", userId: 0, token: "token" },
    { question: "hello", userId: 1, token: "" },
    { question: "x".repeat(4_001), userId: 1, token: "token" },
  ]) {
    const { response, state } = createResponse();
    await controllers.handleChatController({ body } as never, response as never);
    assert.equal(state.status, 400);
  }
  assert.equal(globals.__CHATBOT_CONTROLLER_STUB__.calls.chat.length, 0);
});

test("handleChatController trims input, parses the user id, and returns the answer", async () => {
  const { response, state } = createResponse();
  await controllers.handleChatController(
    { body: { question: "  hello  ", userId: "7", token: "token" } } as never,
    response as never,
  );

  assert.equal(state.status, 200);
  assert.deepEqual(state.body, { success: true, answer: "chat answer" });
  assert.deepEqual(globals.__CHATBOT_CONTROLLER_STUB__.calls.chat, [
    { question: "hello", userId: 7, token: "token" },
  ]);
});

test("report, roadmap, and diagnosis controllers validate and map successful responses", async () => {
  const report = createResponse();
  await controllers.handleCreateReportController(
    { body: { question: "  monthly report  " } } as never,
    report.response as never,
  );
  assert.deepEqual(report.state.body, {
    success: true,
    data: { pdfUrl: "report.pdf" },
  });
  assert.deepEqual(globals.__CHATBOT_CONTROLLER_STUB__.calls.report, [
    { question: "monthly report" },
  ]);

  const roadmap = createResponse();
  await controllers.handleBuildHealthRoadMapController(
    { body: { relative_id: "8", token: "token" } } as never,
    roadmap.response as never,
  );
  assert.deepEqual(roadmap.state.body, {
    success: true,
    data: { pdfUrl: "roadmap.pdf" },
  });

  const diagnosis = createResponse();
  await controllers.handleDiagnosisController(
    { body: { text_input: "  headache  ", relative_id: 9, token: "token" } } as never,
    diagnosis.response as never,
  );
  assert.deepEqual(diagnosis.state.body, {
    success: true,
    data: { answer: "diagnosis answer" },
  });
  assert.deepEqual(globals.__CHATBOT_CONTROLLER_STUB__.calls.diagnosis, [
    { text_input: "headache", relative_id: 9, token: "token" },
  ]);
});

test("roadmap and diagnosis reject invalid identifiers or tokens", async () => {
  const roadmap = createResponse();
  await controllers.handleBuildHealthRoadMapController(
    { body: { relative_id: -1, token: "token" } } as never,
    roadmap.response as never,
  );
  assert.equal(roadmap.state.status, 400);

  const diagnosis = createResponse();
  await controllers.handleDiagnosisController(
    { body: { text_input: "headache", relative_id: 1, token: "" } } as never,
    diagnosis.response as never,
  );
  assert.equal(diagnosis.state.status, 400);
  assert.equal(globals.__CHATBOT_CONTROLLER_STUB__.calls.roadmap.length, 0);
  assert.equal(globals.__CHATBOT_CONTROLLER_STUB__.calls.diagnosis.length, 0);
});

test("handleSummaryMedicalRecordController forwards fileParams", async () => {
  const { response, state } = createResponse();
  const fileParams = [{ mimetype: "image/png", base64: "abc" }];
  await controllers.handleSummaryMedicalRecordController(
    { fileParams } as never,
    response as never,
  );

  assert.deepEqual(globals.__CHATBOT_CONTROLLER_STUB__.calls.summary, [fileParams]);
  assert.deepEqual(state.body, { success: true, data: "summary answer" });
});

test("controller lets service failures propagate to the error middleware", async () => {
  const expected = Object.assign(new Error("service failed"), { status: 503 });
  globals.__CHATBOT_CONTROLLER_STUB__.errors.chat = expected;
  const { response } = createResponse();

  await assert.rejects(
    controllers.handleChatController(
      { body: { question: "hello", userId: 1, token: "token" } } as never,
      response as never,
    ),
    (error: unknown) => error === expected,
  );
});
