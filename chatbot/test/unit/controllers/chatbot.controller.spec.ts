import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type ServiceName = "chat" | "assistant" | "diagnosis" | "patientChat" | "deletePatientConversation";

type ControllerStub = {
  calls: Record<ServiceName, unknown[]>;
  results: Record<ServiceName, unknown>;
  errors: Partial<Record<ServiceName, unknown>>;
};

const globals = globalThis as typeof globalThis & {
  __CHATBOT_CONTROLLER_STUB__: ControllerStub;
};

globals.__CHATBOT_CONTROLLER_STUB__ = {
  calls: { chat: [], assistant: [], diagnosis: [], patientChat: [], deletePatientConversation: [] },
  results: {
    chat: { answer: "chat answer" },
    assistant: { action: "ANSWER", message: "Assistant response" },
    diagnosis: { answer: "diagnosis answer" },
    patientChat: { action: "ANSWER", message: "patient answer" },
    deletePatientConversation: { success: true },
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
    export const handleReportAssistantService = (args) => invoke("assistant", args);
    export const handleDiagnosisService = (args) => invoke("diagnosis", args);
    export const handlePatientChatService = (args) => invoke("patientChat", args);
    export const handleDeletePatientChatConversationService = (...args) => invoke("deletePatientConversation", args);
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

test("report assistant rejects missing or mismatched verified actors", async () => {
  for (const request of [
    { body: { userId: 7, message: "report", conversationId: 11, turnId: 1, threadId: "report-assistant:v1:7:11", mode: "MESSAGE", historySeed: [] } },
    { body: { userId: 7, message: "report", conversationId: 11, turnId: 1, threadId: "report-assistant:v1:7:11", mode: "MESSAGE", historySeed: [] }, actorUserId: 8 },
  ]) {
    const { response, state } = createResponse();
    await controllers.handleReportAssistantController(request as never, response as never);
    assert.equal(state.status, 401);
  }
  assert.equal(globals.__CHATBOT_CONTROLLER_STUB__.calls.assistant.length, 0);
});

test("report assistant validates bounded history and forwards normalized input", async () => {
  const { response, state } = createResponse();
  await controllers.handleReportAssistantController(
    {
      actorUserId: 7,
      body: {
        userId: "7",
        message: "  summarize schedules  ",
        conversationId: "11",
        turnId: "12",
        threadId: "report-assistant:v1:7:11",
        mode: "MESSAGE",
        historySeed: [{ role: "user", content: "prior request" }],
      },
    } as never,
    response as never,
  );

  assert.equal(state.status, 200);
  assert.deepEqual(state.body, {
    success: true,
    data: { action: "ANSWER", message: "Assistant response" },
  });
  assert.deepEqual(globals.__CHATBOT_CONTROLLER_STUB__.calls.assistant, [
    {
      userId: 7,
      conversationId: 11,
      turnId: 12,
      threadId: "report-assistant:v1:7:11",
      mode: "MESSAGE",
      message: "summarize schedules",
      historySeed: [{ role: "user", content: "prior request" }],
    },
  ]);
});

test("diagnosis controller validates and maps successful responses", async () => {
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

test("diagnosis rejects invalid identifiers or tokens", async () => {
  const diagnosis = createResponse();
  await controllers.handleDiagnosisController(
    { body: { text_input: "headache", relative_id: 1, token: "" } } as never,
    diagnosis.response as never,
  );
  assert.equal(diagnosis.state.status, 400);
  assert.equal(globals.__CHATBOT_CONTROLLER_STUB__.calls.diagnosis.length, 0);
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
