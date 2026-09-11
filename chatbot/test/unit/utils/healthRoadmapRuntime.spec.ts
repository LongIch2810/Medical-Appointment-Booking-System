import assert from "node:assert/strict";
import test from "node:test";
import { getChatModel, getVisionModel } from "../../../src/configs/llm.js";
import {
  getHealthRoadmapFinalError,
  getHealthRoadmapMaxRetries,
  isHealthRoadmapTimeoutError,
  isRetryableHealthRoadmapError,
  runHealthRoadmapOperation,
} from "../../../src/utils/healthRoadmapRuntime.js";

const runtime = {
  requestId: "request-1",
  relativeId: 1,
  node: "health_metric_node",
};

test("uses two retries by default", () => {
  assert.equal(getHealthRoadmapMaxRetries(undefined), 2);
  assert.equal(getHealthRoadmapMaxRetries("3"), 3);
  assert.equal(getHealthRoadmapMaxRetries("invalid"), 2);
  assert.equal(getHealthRoadmapMaxRetries("0"), 0);
});

test("uses the bounded default LLM timeout for a roadmap operation", () => {
  const model = getChatModel({ model: "gpt-5-mini", temperature: 0 });
  assert.equal(model.timeout, 30_000);
});

test("routes OpenAI models with cost-aware reasoning settings", () => {
  const previousMainModel = process.env.OPENAI_MODEL;
  const previousFastModel = process.env.OPENAI_FAST_MODEL;
  const previousVisionModel = process.env.OPENAI_VISION_MODEL;

  process.env.OPENAI_MODEL = "gpt-5-mini";
  process.env.OPENAI_FAST_MODEL = "gpt-4o-mini";
  process.env.OPENAI_VISION_MODEL = "gpt-4o-mini";

  try {
    const mainModel = getChatModel();
    const qualityModel = getChatModel({
      profile: "quality",
      temperature: 0.3,
    });
    const fastModel = getChatModel({ profile: "fast" });
    const visionModel = getVisionModel();

    assert.equal(mainModel.model, "gpt-5-mini");
    assert.equal(qualityModel.model, "gpt-5-mini");
    assert.equal(fastModel.model, "gpt-4o-mini");
    assert.equal(visionModel.model, "gpt-4o-mini");
    assert.deepEqual(mainModel.modelKwargs, {
      reasoning_effort: "minimal",
    });
    assert.deepEqual(qualityModel.modelKwargs, {
      reasoning_effort: "low",
    });
    assert.equal(qualityModel.temperature, undefined);
    assert.deepEqual(fastModel.modelKwargs, {});
    assert.equal(fastModel.temperature, 0);
    assert.deepEqual(visionModel.modelKwargs, {});
    assert.equal(visionModel.temperature, 0);

    const mainRequest = mainModel.invocationParams();
    const qualityRequest = qualityModel.invocationParams();
    const fastRequest = fastModel.invocationParams();
    const visionRequest = visionModel.invocationParams();

    assert.equal(mainRequest.reasoning_effort, "minimal");
    assert.equal(mainRequest.temperature, undefined);
    assert.equal(qualityRequest.reasoning_effort, "low");
    assert.equal(qualityRequest.temperature, undefined);
    assert.equal(fastRequest.reasoning_effort, undefined);
    assert.equal(fastRequest.temperature, 0);
    assert.equal(visionRequest.reasoning_effort, undefined);
    assert.equal(visionRequest.temperature, 0);
  } finally {
    if (previousMainModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previousMainModel;

    if (previousFastModel === undefined) delete process.env.OPENAI_FAST_MODEL;
    else process.env.OPENAI_FAST_MODEL = previousFastModel;

    if (previousVisionModel === undefined) delete process.env.OPENAI_VISION_MODEL;
    else process.env.OPENAI_VISION_MODEL = previousVisionModel;
  }
});

test("retries transient tool errors and succeeds before the final retry", async () => {
  let attempts = 0;
  const result = await runHealthRoadmapOperation(
    async () => {
      attempts += 1;
      if (attempts < 3) throw { status: 503, message: "provider unavailable" };
      return "ok";
    },
    runtime,
    { maxRetries: 2, retryDelayMs: 0 }
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

test("reports an upstream error after all retry attempts", async () => {
  let attempts = 0;
  const error = { status: 503, message: "provider unavailable" };

  await assert.rejects(
    runHealthRoadmapOperation(
      async () => {
        attempts += 1;
        throw error;
      },
      runtime,
      { maxRetries: 2, retryDelayMs: 0 }
    ),
    (received: unknown) =>
      typeof received === "object" &&
      received !== null &&
      (received as { code?: string }).code === "UPSTREAM_UNAVAILABLE"
  );

  assert.equal(attempts, 3);
});

test("does not retry health-profile validation and access errors", async () => {
  assert.equal(isRetryableHealthRoadmapError({ status: 404 }), false);
  assert.equal(isRetryableHealthRoadmapError({ status: 401 }), false);
  assert.equal(isRetryableHealthRoadmapError({ status: 429 }), true);
  assert.equal(isRetryableHealthRoadmapError({ code: "ETIMEDOUT" }), true);
});

test("recognizes provider timeout errors", () => {
  assert.equal(isHealthRoadmapTimeoutError({ code: "ETIMEDOUT" }), true);
  assert.equal(isHealthRoadmapTimeoutError({ code: "ECONNABORTED" }), true);
  assert.equal(isHealthRoadmapTimeoutError(new Error("provider failed")), false);
  assert.equal(isHealthRoadmapTimeoutError({ status: 504 }), true);
});

test("prioritizes timeout when several graph nodes fail", () => {
  assert.deepEqual(
    getHealthRoadmapFinalError([
      { status: 500, code: "UPSTREAM_INTERNAL_ERROR", message: "internal", node: "first" },
      { status: 504, code: "UPSTREAM_GATEWAY_TIMEOUT", message: "timeout", node: "second" },
    ]),
    {
      status: 504,
      code: "UPSTREAM_GATEWAY_TIMEOUT",
      success: false,
      message: "AI chưa phản hồi sau 3 lần thử. Vui lòng thử lại sau.",
    }
  );
});
