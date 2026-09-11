import assert from "node:assert/strict";
import test from "node:test";
import { ClinicalSuggestionTool } from "../../../src/tools/clinical_suggestion.tool.js";

// ClinicalSuggestionTool's func is pure LLM-prompt wiring (formats diagnosis[]
// into JSON, pipes it through a structured-output LLM call) with no branch
// logic of its own — the only independently-testable surface is its static
// tool shape and the diagnosisArraySchema-based input schema it validates
// against before the LLM is ever called.

test("exposes the expected tool name and a description mentioning clinical suggestions", () => {
  assert.equal(ClinicalSuggestionTool.name, "clinical_suggestion_tool");
  assert.match(ClinicalSuggestionTool.description, /chẩn đoán/);
});

test("schema accepts a well-formed diagnosis array", () => {
  const result = ClinicalSuggestionTool.schema.safeParse({
    diagnosis: [
      { id: "1", name: "Cúm mùa", probability: 0.8 },
      { id: "2", name: "Viêm họng", probability: 0.4 },
    ],
  });
  assert.equal(result.success, true);
});

test("schema rejects a diagnosis entry with an out-of-range probability", () => {
  const result = ClinicalSuggestionTool.schema.safeParse({
    diagnosis: [{ id: "1", name: "Cúm mùa", probability: 1.5 }],
  });
  assert.equal(result.success, false);
});

test("schema rejects a missing diagnosis field entirely", () => {
  const result = ClinicalSuggestionTool.schema.safeParse({});
  assert.equal(result.success, false);
});
