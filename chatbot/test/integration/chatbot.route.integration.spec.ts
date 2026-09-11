import assert from "node:assert/strict";
import path from "node:path";
import { after, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { registerEsmMocks } from "../unit/_helpers/registerMocks.mjs";
import { InMemoryRateLimitStore } from "../../src/middlewares/rateLimitStore.js";

type ServiceName = "chat" | "report" | "roadmap" | "summary";

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
  calls: { chat: [], report: [], roadmap: [], summary: [] },
  results: {
    chat: { answer: "chat answer" },
    report: { pdfUrl: "report.pdf" },
    roadmap: { pdfUrl: "roadmap.pdf" },
    summary: "summary answer",
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
    export const handleCreateReportService = (args) => invoke("report", args);
    export const handleBuildHealthRoadMapService = (args) => invoke("roadmap", args);
    export const handleDiagnosisService = () => {
      throw new Error("Diagnosis is not exposed by the production router");
    };
    export const handleSummaryMedicalRecordService = (args) => invoke("summary", args);
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
    report: { pdfUrl: "report.pdf" },
    roadmap: { pdfUrl: "roadmap.pdf" },
    summary: "summary answer",
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

  it("routes create-report through the real controller", async () => {
    const response = await authenticated(
      request(buildApp()).post("/chatbot/create-report"),
    ).send({ question: "  monthly report  " });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      data: { pdfUrl: "report.pdf" },
    });
    assert.deepEqual(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.report, [
      { question: "monthly report" },
    ]);
  });

  it("exposes build-health-roadmap and validates its body", async () => {
    const invalid = await authenticated(
      request(buildApp()).post("/chatbot/build-health-roadmap"),
    ).send({ relative_id: 0, token: tokenForUser1 });
    assert.equal(invalid.status, 400);
    assert.equal(
      globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.roadmap.length,
      0,
    );

    const response = await authenticated(
      request(buildApp()).post("/chatbot/build-health-roadmap"),
    ).send({ relative_id: "8", token: tokenForUser1 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      data: { pdfUrl: "roadmap.pdf" },
    });
    assert.deepEqual(globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.roadmap, [
      { relative_id: 8, token: tokenForUser1 },
    ]);
  });

  it("parses and forwards a valid image upload through Multer and xorValidate", async () => {
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const response = await authenticated(
      request(buildApp()).post("/chatbot/upload/summary-medical-record"),
    )
      .set("Authorization", `Bearer ${tokenForUser1}`)
      .attach("images", pngSignature, {
        filename: "scan.png",
        contentType: "image/png",
      });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true, data: "summary answer" });

    const [fileParams] = globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls
      .summary as [{ imageFiles: Express.Multer.File[] }];
    assert.equal(fileParams.imageFiles.length, 1);
    assert.equal(fileParams.imageFiles[0].originalname, "scan.png");
    assert.equal(fileParams.imageFiles[0].mimetype, "image/png");
    assert.deepEqual(fileParams.imageFiles[0].buffer, pngSignature);
  });

  it("parses and forwards a valid PDF upload", async () => {
    const pdf = Buffer.from("%PDF-1.4 integration test");
    const response = await authenticated(
      request(buildApp()).post("/chatbot/upload/summary-medical-record"),
    )
      .set("Authorization", `Bearer ${tokenForUser1}`)
      .attach("pdf", pdf, {
        filename: "record.pdf",
        contentType: "application/pdf",
      });

    assert.equal(response.status, 200);
    const [fileParams] = globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls
      .summary as [{ pdfFile: Express.Multer.File }];
    assert.equal(fileParams.pdfFile.originalname, "record.pdf");
    assert.deepEqual(fileParams.pdfFile.buffer, pdf);
  });

  it("rejects invalid upload combinations before the service boundary", async () => {
    const noFile = await authenticated(
      request(buildApp()).post("/chatbot/upload/summary-medical-record"),
    );
    assert.equal(noFile.status, 400);

    const both = await authenticated(
      request(buildApp()).post("/chatbot/upload/summary-medical-record"),
    )
      .attach("images", Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
        filename: "scan.jpg",
        contentType: "image/jpeg",
      })
      .attach("pdf", Buffer.from("%PDF-1.4"), {
        filename: "record.pdf",
        contentType: "application/pdf",
      });

    assert.equal(both.status, 400);
    assert.match(both.body.message, /images.*pdf/i);
    assert.equal(
      globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.summary.length,
      0,
    );
  });

  it("normalizes Multer limit errors through the application error handler", async () => {
    let pending = authenticated(
      request(buildApp()).post("/chatbot/upload/summary-medical-record"),
    );
    for (let index = 0; index < 6; index += 1) {
      pending = pending.attach(
        "images",
        Buffer.from([0xff, 0xd8, 0xff, index]),
        { filename: `scan-${index}.jpg`, contentType: "image/jpeg" },
      );
    }

    const response = await pending;
    assert.equal(response.status, 413);
    assert.equal(response.body.code, "LIMIT_FILE_COUNT");
    assert.equal(
      globals.__CHATBOT_ROUTE_SERVICE_STUB__.calls.summary.length,
      0,
    );
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
    globals.__CHATBOT_ROUTE_SERVICE_STUB__.errors.report = Object.assign(
      new Error("database password leaked"),
      { status: 500 },
    );
    const failure = await authenticated(
      request(buildApp()).post("/chatbot/create-report"),
    ).send({ question: "report" });

    assert.equal(failure.status, 500);
    assert.equal(failure.body.code, "UPSTREAM_INTERNAL_ERROR");
    assert.equal(
      failure.body.err,
      "Chatbot service could not process the request.",
    );
    assert.doesNotMatch(JSON.stringify(failure.body), /database password/i);
  });

  it("returns 429 after the production expensive-endpoint quota", async () => {
    const app = buildApp();
    const first = await authenticated(
      request(app).post("/chatbot/create-report"),
    ).send({ question: "report" });
    assert.equal(first.status, 200);

    const remaining = Number(first.headers["ratelimit-remaining"]);
    assert.ok(Number.isInteger(remaining) && remaining > 0);
    for (let index = 0; index < remaining; index += 1) {
      const withinQuota = await authenticated(
        request(app).post("/chatbot/create-report"),
      ).send({ question: "report" });
      assert.equal(withinQuota.status, 200);
    }

    const blocked = await authenticated(
      request(app).post("/chatbot/create-report"),
    ).send({ question: "report" });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, "CHATBOT_RATE_LIMITED");
    assert.equal(blocked.headers["ratelimit-remaining"], "0");
  });
});
