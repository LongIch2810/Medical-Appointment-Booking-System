import assert from "node:assert/strict";
import test from "node:test";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import diagnosisGraph from "../../../src/langgraph/diagnosis.graph.js";
import { GetHealthProfileTool } from "../../../src/tools/get_health_profile.tool.js";
import { AnalyzeSymptomsTool } from "../../../src/tools/symptoms_analyzer.tool.js";
import { DiagnosisTool } from "../../../src/tools/diagnosis.tool.js";
import { ClinicalSuggestionTool } from "../../../src/tools/clinical_suggestion.tool.js";

const HEALTH_PROFILE = { fullname: "Nguyen Van A", gender: "male" };
const SYMPTOMS = [{ id: 1, symptoms_name: "dau dau" }];
const DIAGNOSIS = [{ id: 1, name: "Cam cum", probability: 0.8 }];
const SUGGESTION = {
  summary: "Nghi ngoi",
  analysis: [{ disease: "Cam cum", reason: "sot nhe", recommendations: ["Uong nhieu nuoc"] }],
};

// Safety net installed in every test that invokes the compiled graph: the
// health_profile_node branch and the analyze_symptoms/diagnosis/suggestion
// branch run concurrently (both fan out from parallel_node) and can each
// independently reach merged_node -> llm_answer_node depending on which
// finishes first, regardless of which scenario a given test is targeting.
// Without stubbing ChatOpenAI's raw invoke() too (not just
// withStructuredOutput), an unrelated branch racing ahead of the one under
// test would trigger a REAL network call to the LLM. See the "unmocked
// invoke() causes a real 60s network call" finding in the summary.
function stubLlmInvoke(t: import("node:test").TestContext) {
  return t.mock.method(ChatOpenAI.prototype, "invoke", async () => ({
    content: "mocked final answer",
  }));
}

test("diagnosisGraph module imports cleanly and exposes an invokable compiled graph", () => {
  assert.equal(typeof diagnosisGraph, "object");
  assert.equal(typeof diagnosisGraph.invoke, "function");
});

test("runs the full success path end-to-end when input is valid and every tool resolves", async (t) => {
  t.mock.method(GetHealthProfileTool, "invoke", async () => HEALTH_PROFILE);
  t.mock.method(AnalyzeSymptomsTool, "invoke", async () => SYMPTOMS);
  t.mock.method(DiagnosisTool, "invoke", async () => DIAGNOSIS);
  t.mock.method(ClinicalSuggestionTool, "invoke", async () => SUGGESTION);
  stubLlmInvoke(t);

  const result = await diagnosisGraph.invoke({
    text_input: "toi bi dau dau va sot",
    token: "token-123",
    relative_id: 1,
  });

  assert.equal(result.answer, "mocked final answer");
  assert.deepEqual(result.health_profile, HEALTH_PROFILE);
  assert.deepEqual(result.symptoms, SYMPTOMS);
  assert.deepEqual(result.diagnosis, DIAGNOSIS);
  assert.deepEqual(result.suggestion, SUGGESTION);
  assert.deepEqual(result.merged_data, {
    health_profile: HEALTH_PROFILE,
    symptoms: SYMPTOMS,
    diagnosis: DIAGNOSIS,
    suggestion: SUGGESTION,
  });
  assert.equal(result.final_result.status, 200);
  assert.equal(result.final_result.success, true);
});

test("routes straight to the LLM error node when input_node rejects invalid input, without touching any tool", async (t) => {
  const getHealthProfileMock = t.mock.method(GetHealthProfileTool, "invoke", async () => HEALTH_PROFILE);
  t.mock.method(ChatOpenAI.prototype, "withStructuredOutput", () =>
    RunnableLambda.from(async () => ({
      status: 400,
      error_detail: "Vui long nhap trieu chung hop le.",
    })),
  );
  stubLlmInvoke(t);

  const result = await diagnosisGraph.invoke({
    text_input: "hi",
    token: "",
    relative_id: undefined,
  });

  // input_node's conditional edge short-circuits straight to the error node
  // — parallel_node (and therefore every tool) must never run.
  assert.equal(getHealthProfileMock.mock.callCount(), 0);
  assert.equal(result.errorInput?.node, "input_node");
  assert.equal(result.final_result.success, false);
  assert.equal(result.final_result.status, 400);
  assert.equal(result.final_result.message, "Vui long nhap trieu chung hop le.");
});

test("falls back to a generic 500 message when the LLM error-formatting call itself throws", async (t) => {
  t.mock.method(ChatOpenAI.prototype, "withStructuredOutput", () =>
    RunnableLambda.from(async () => {
      throw new Error("gateway unreachable");
    }),
  );
  stubLlmInvoke(t);

  const result = await diagnosisGraph.invoke({
    text_input: "hi",
    token: "",
    relative_id: undefined,
  });

  assert.equal(result.final_result.success, false);
  assert.equal(result.final_result.status, 500);
  assert.match(
    result.final_result.message,
    /Hệ thống đang gặp sự cố khi tạo thông báo lỗi/,
  );
});

test("carries a health-profile AND symptom-analysis failure through to the error node deterministically", async (t) => {
  // Both parallel branches (health_profile_node and analyze_symptoms_node)
  // are made to fail here so that neither can race ahead into
  // merged_node/llm_answer_node — see stubLlmInvoke's comment above for why
  // that race exists. This keeps the scenario deterministic while still
  // exercising real error propagation from two independent tool failures
  // into the shared llm_generate_error_answer_node.
  t.mock.method(GetHealthProfileTool, "invoke", async () => {
    throw new Error("backend unreachable");
  });
  t.mock.method(AnalyzeSymptomsTool, "invoke", async () => []);
  t.mock.method(ChatOpenAI.prototype, "withStructuredOutput", () =>
    RunnableLambda.from(async () => ({
      status: 404,
      error_detail: "Khong the xu ly yeu cau chan doan.",
    })),
  );
  stubLlmInvoke(t);

  const result = await diagnosisGraph.invoke({
    text_input: "toi bi dau dau va sot",
    token: "token-123",
    relative_id: 1,
  });

  assert.equal(result.errorHealthProfile?.node, "health_profile_node");
  assert.equal(result.errorSymptoms?.status, 404);
  assert.equal(result.errorSymptoms?.node, "analyze_symptoms_node");
  assert.equal(result.diagnosis, undefined);
  assert.equal(result.final_result.success, false);
  assert.equal(result.final_result.status, 404);
  assert.equal(result.final_result.message, "Khong the xu ly yeu cau chan doan.");
});
