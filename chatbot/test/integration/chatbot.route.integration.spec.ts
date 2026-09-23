import assert from "node:assert/strict";
import path from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { registerEsmMocks } from "../unit/_helpers/registerMocks.mjs";
import { InMemoryRateLimitStore } from "../../src/middlewares/rateLimitStore.js";

type ServiceName = "chat" | "assistant" | "patient" | "deletePatient";

type ServiceStub = {
  calls: Record<ServiceName, unknown[]>;
  results: Record<ServiceName, unknown>;
  errors: Partial<Record<ServiceName, unknown>>;
};

const INTERNAL_KEY = "integration-test-internal-key-1234567890";
const originalKey = process.env.CHATBOT_INTERNAL_KEY;
const ACCESS_TOKEN_SECRET = "integration-test-access-token-secret";
const originalAccessSecret = process.env.ACCESS_TOKEN_SECRET;
// attachVerifiedActor (item 8) now verifies `token` as a real JWT — these
// stand in for the user's real access token, which the backend forwards
// as-is in production.
const tokenForUser1 = jwt.sign(
  { sub: 1, roles: ["PATIENT"] },
  ACCESS_TOKEN_SECRET,
);
const tokenForUser7 = jwt.sign(
  { sub: 7, roles: ["PATIENT"] },
  ACCESS_TOKEN_SECRET,
);
const globals = globalThis as typeof globalThis & {
  __CHATBOT_ROUTE_SERVICE_STUB__: ServiceStub;
};

globals.__CHATBOT_ROUTE_SERVICE_STUB__ = {
  calls: { chat: [], assistant: [], patient: [], deletePatient: [] },
  results: {
    chat: { answer: "chat answer" },
    assistant: { action: "ANSWER", message: "Assistant response" },
    patient: { action: "ANSWER", message: "Patient response" },
    deletePatient: { success: true },
  },
  errors: {},
};

const here = path.dirname(fileURLToPath(import.meta.url));
const controllerDirUrl =
  pathToFileURL(path.resolve(here, "../../src/controllers")).href + "/";

registerEsmMocks(controllerDirUrl, {
  "../services/chatbot.service.js": `
    const invoke = async (name, args) => {
      const state = globalThis.__CHATBOT_ROUTE_SERVICE_STUB__;
      state.calls[name].push(args);
      if (Object.prototype.hasOwnProperty.call(state.errors, name)) {
        throw state.errors[name];
      }
      return state.results[name];
    };
    export const handleChatService = (args) => invoke("chat", args);
    export const handleReportAssistantService = (args) => invoke("assistant", args);
    export const handlePatientChatService = (args) => invoke("patient", args);
    export const handleDeletePatientChatConversationService = (...args) => invoke("deletePatient", args);
    export const handleDiagnosisService = () => {
      throw new Error("Diagnosis is not exposed by the production router");
    };
  `,
});

const { default: errorHandler } =
  await import("../../src/middlewares/errorHandler.js");
const { createChatbotRouter } =
  await import("../../src/routes/chatbot.route.js");
const chatbotRouter = createChatbotRouter(new InMemoryRateLimitStore());

function resetStub() {
  const stub = globals.__CHATBOT_ROUTE_SERVICE_STUB__;
  for (const calls of Object.values(stub.calls)) calls.length = 0;
  stub.errors = {};
  stub.results = {
    chat: { answer: "chat answer" },
    assistant: { action: "ANSWER", message: "Assistant response" },
    patient: { action: "ANSWER", message: "Patient response" },
    deletePatient: { success: true },
  };
}

function buildApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use("/chatbot", chatbotRouter);
  app.use(errorHandler);
  return app;
}

function authenticated(postRequest: request.Test) {
  return postRequest.set("x-chatbot-internal-key", INTERNAL_KEY);
}

const assistantPlan = {
  schemaVersion: 1,
  title: "Lịch hẹn theo chuyên khoa",
  objective: "So sánh số lịch hẹn theo chuyên khoa.",
  query: "Tổng hợp số lịch hẹn theo chuyên khoa trong kỳ.",
  fromDate: "2026-08-01",
  toDate: "2026-08-31",
  comparisonFromDate: null,
  comparisonToDate: null,
  metrics: ["appointment_count"],
  groupBy: ["specialty_name"],
  sourceViews: ["chatbot_report_appointments_view", "chatbot_report_specialties_view"],
};

describe("chatbot production router integration", () => {
  before(() => {
    process.env.CHATBOT_INTERNAL_KEY = INTERNAL_KEY;
    process.env.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
    // The router now rate-limits through a real, PERSISTENT Redis-backed
    // store (item 8 — so multiple chatbot replicas share one quota). Flush
    // this dedicated db first so leftover counters from a previous test run
    // can't make "returns 429 after quota" flaky.
  });

  beforeEach(resetStub);

  after(async () => {
    if (originalKey === undefined) delete process.env.CHATBOT_INTERNAL_KEY;
    else process.env.CHATBOT_INTERNAL_KEY = originalKey;
    if (originalAccessSecret === undefined)
      delete process.env.ACCESS_TOKEN_SECRET;
    else process.env.ACCESS_TOKEN_SECRET = originalAccessSecret;
    delete (globalThis as { __CHATBOT_ROUTE_SERVICE_STUB__?: ServiceStub })
      .__CHATBOT_ROUTE_SERVICE_STUB__;
    // Close the shared Redis connection so `node --test` can exit instead of
    // hanging on an open handle.
  });

  it("mounts the real router and rejects requests without the internal service key", async () => {
    const response = await request(buildApp()).post("/chatbot/chat").send({
      question: "hello",
      userId: 1,
      token: "token",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.code, "CHATBOT_UNAUTHORIZED");
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.chat.length, 0);
  });

  it("runs the real chat controller and forwards normalized input to the service", async () => {
    const response = await authenticated(
      request(buildApp()).post("/chatbot/chat"),
    ).send({ question: "  hello  ", userId: "7", token: tokenForUser7 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true, answer: "chat answer" });
    assert.deepEqual(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.chat, [
      { question: "hello", userId: 7, token: tokenForUser7 },
    ]);
    assert.equal(response.headers["ratelimit-limit"], "120");
  });

  it("short-circuits invalid chat input before the service boundary", async () => {
    const response = await authenticated(
      request(buildApp()).post("/chatbot/chat"),
    ).send({ question: " ", userId: 1, token: tokenForUser1 });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      success: false,
      message: "Question is invalid or too long.",
    });
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.chat.length, 0);
  });

  it("does not expose retired generic report and health-roadmap routes", async () => {
    for (const route of ["/chatbot/create-report", "/chatbot/build-health-roadmap"]) {
      const response = await authenticated(
        request(buildApp()).post(route),
      ).send({ question: "monthly report" });

      assert.equal(response.status, 404);
    }
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.assistant.length, 0);
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.patient.length, 0);
  });

  it("verifies forwarded identity and passes assistant context to the service", async () => {
    const response = await authenticated(
      request(buildApp()).post("/chatbot/report-assistant"),
    )
      .set("Authorization", `Bearer ${tokenForUser7}`)
      .send({ userId: "7", conversationId: 11, turnId: 1, threadId: "report-assistant:v1:7:11", mode: "MESSAGE", message: "Tóm tắt lịch hẹn", historySeed: [] });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      data: { action: "ANSWER", message: "Assistant response" },
    });
    assert.deepEqual(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.assistant, [
      { userId: 7, conversationId: 11, turnId: 1, threadId: "report-assistant:v1:7:11", mode: "MESSAGE", message: "Tóm tắt lịch hẹn", historySeed: [] },
    ]);
    assert.equal(response.headers["ratelimit-limit"], "30");
  });

  it("rejects a user id that does not match the verified JWT subject", async () => {
    const response = await authenticated(
      request(buildApp()).post("/chatbot/report-assistant"),
    )
      .set("Authorization", `Bearer ${tokenForUser7}`)
      .send({ userId: 1, conversationId: 11, turnId: 1, threadId: "report-assistant:v1:1:11", mode: "MESSAGE", message: "report", historySeed: [] });

    assert.equal(response.status, 401);
    assert.equal(response.body.code, "CHATBOT_ACTOR_MISMATCH");
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.assistant.length, 0);
  });

  it("validates patient thread identity and forwards only a verified patient JWT", async () => {
    const body = {
      userId: "7",
      conversationId: 23,
      turnId: "e9ed5cae-574c-4f32-bfef-c5fc141c11db",
      threadId: "patient-chat:v1:7:23",
      mode: "MESSAGE",
      message: "  Xin chào  ",
      historySeed: [{ role: "user", content: "hello" }],
    };
    const response = await authenticated(request(buildApp()).post("/chatbot/patient-chat"))
      .set("Authorization", `Bearer ${tokenForUser7}`)
      .send(body);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      data: { action: "ANSWER", message: "Patient response" },
    });
    assert.deepEqual(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.patient, [{
      userId: 7,
      conversationId: 23,
      turnId: body.turnId,
      threadId: body.threadId,
      mode: "MESSAGE",
      message: "Xin chào",
      historySeed: body.historySeed,
      token: tokenForUser7,
    }]);
  });

  it("rejects a caller-selected patient thread belonging to another identity", async () => {
    const response = await authenticated(request(buildApp()).post("/chatbot/patient-chat"))
      .set("Authorization", `Bearer ${tokenForUser7}`)
      .send({
        userId: 7,
        conversationId: 23,
        turnId: "e9ed5cae-574c-4f32-bfef-c5fc141c11db",
        threadId: "patient-chat:v1:1:23",
        mode: "MESSAGE",
        message: "hello",
        historySeed: [],
      });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, "PATIENT_CHAT_INVALID_INPUT");
    assert.equal(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.patient.length, 0);
  });

  it("applies the confirmed-report quota independently of the chat quota", async () => {
    const app = buildApp();
    const postAssistant = (confirm = true) => {
      const body = {
        userId: 7,
        conversationId: 11,
        turnId: 1,
        threadId: "report-assistant:v1:7:11",
        mode: confirm ? "CONFIRM_PLAN" : "MESSAGE",
        message: "Tạo báo cáo theo kế hoạch đã duyệt",
        ...(confirm ? { confirmedPlan: assistantPlan } : { historySeed: [] }),
      };
      return authenticated(request(app).post("/chatbot/report-assistant"))
        .set("Authorization", `Bearer ${tokenForUser7}`)
        .send(body);
    };

    for (let index = 0; index < 3; index += 1) {
      assert.equal((await postAssistant()).status, 200);
    }
    const blocked = await postAssistant();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, "CHATBOT_RATE_LIMITED");

    const chatStillAllowed = await postAssistant(false);
    assert.equal(chatStillAllowed.status, 200);
  });

  it("passes business errors through and hides internal service error details", async () => {
    globals.__CHATBOT_ROUTE_SERVICE_STUB__.errors.chat = Object.assign(
      new Error("The requested slot is unavailable."),
      { status: 409, code: "SLOT_UNAVAILABLE" },
    );
    const conflict = await authenticated(
      request(buildApp()).post("/chatbot/chat"),
    ).send({ question: "book", userId: 1, token: tokenForUser1 });

    assert.equal(conflict.status, 409);
    assert.deepEqual(conflict.body, {
      SC: 409,
      code: "SLOT_UNAVAILABLE",
      err: "The requested slot is unavailable.",
    });

    resetStub();
    globals.__CHATBOT_ROUTE_SERVICE_STUB__.errors.assistant = Object.assign(
      new Error("database password leaked"),
      { status: 500 },
    );
    const failure = await authenticated(
      request(buildApp()).post("/chatbot/report-assistant"),
    )
      .set("Authorization", `Bearer ${tokenForUser1}`)
      .send({
        userId: 1,
        conversationId: 12,
        turnId: 2,
        threadId: "report-assistant:v1:1:12",
        mode: "MESSAGE",
        message: "report",
        historySeed: [],
      });

    assert.equal(failure.status, 500);
    assert.equal(failure.body.code, "UPSTREAM_INTERNAL_ERROR");
    assert.equal(
      failure.body.err,
      "Chatbot service could not process the request.",
    );
    assert.doesNotMatch(JSON.stringify(failure.body), /database password/i);
  });

  it("returns 429 after the production report-assistant chat quota", async () => {
    const app = buildApp();
    const postAssistantMessage = () =>
      authenticated(request(app).post("/chatbot/report-assistant"))
        .set("Authorization", `Bearer ${tokenForUser7}`)
        .send({
          userId: 7,
          conversationId: 11,
          turnId: 3,
          threadId: "report-assistant:v1:7:11",
          mode: "MESSAGE",
          message: "Summarize the approved report plan.",
          historySeed: [],
        });
    const first = await postAssistantMessage();
    assert.equal(first.status, 200);

    assert.equal(first.headers["ratelimit-limit"], "30");
    const remaining = Number(first.headers["ratelimit-remaining"]);
    assert.ok(Number.isInteger(remaining) && remaining >= 0);
    for (let index = 0; index < remaining; index += 1) {
      const withinQuota = await postAssistantMessage();
      assert.equal(withinQuota.status, 200);
    }

    const blocked = await postAssistantMessage();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, "CHATBOT_RATE_LIMITED");
    assert.equal(blocked.headers["ratelimit-remaining"], "0");
  });
});
