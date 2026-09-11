import assert from "node:assert/strict";
import test from "node:test";
import { DiagnosisTool, diagnosisArraySchema } from "../../../src/tools/diagnosis.tool.js";

// diagnosisArraySchema is real, independently-testable validation logic shared
// with clinical_suggestion.tool.ts. DiagnosisTool's own func is otherwise just
// LLM-prompt wiring with no branch logic, so it gets a smoke test of its static
// shape only.

test("diagnosisArraySchema accepts an empty array", () => {
  const result = diagnosisArraySchema.safeParse([]);
  assert.equal(result.success, true);
});

test("diagnosisArraySchema accepts a well-formed diagnosis list", () => {
  const result = diagnosisArraySchema.safeParse([
    { id: "d1", name: "Cúm mùa", probability: 0.75 },
    { id: "d2", name: "Viêm phổi", probability: 0 },
    { id: "d3", name: "Sốt xuất huyết", probability: 1 },
  ]);
  assert.equal(result.success, true);
});

test("diagnosisArraySchema rejects a probability above 1", () => {
  const result = diagnosisArraySchema.safeParse([
    { id: "d1", name: "Cúm mùa", probability: 1.01 },
  ]);
  assert.equal(result.success, false);
});

test("diagnosisArraySchema rejects a negative probability", () => {
  const result = diagnosisArraySchema.safeParse([
    { id: "d1", name: "Cúm mùa", probability: -0.1 },
  ]);
  assert.equal(result.success, false);
});

test("diagnosisArraySchema rejects an empty id", () => {
  const result = diagnosisArraySchema.safeParse([
    { id: "", name: "Cúm mùa", probability: 0.5 },
  ]);
  assert.equal(result.success, false);
});

test("diagnosisArraySchema rejects an empty name", () => {
  const result = diagnosisArraySchema.safeParse([
    { id: "d1", name: "", probability: 0.5 },
  ]);
  assert.equal(result.success, false);
});

test("diagnosisArraySchema rejects a missing field", () => {
  const result = diagnosisArraySchema.safeParse([{ id: "d1", probability: 0.5 }]);
  assert.equal(result.success, false);
});

test("DiagnosisTool exposes the expected name, description, and input schema", () => {
  assert.equal(DiagnosisTool.name, "diagnosis_tool");
  assert.match(DiagnosisTool.description, /triệu chứng/);

  const valid = DiagnosisTool.schema.safeParse({
    symptoms: [],
  });
  assert.equal(valid.success, true);

  const missing = DiagnosisTool.schema.safeParse({});
  assert.equal(missing.success, false);
});
