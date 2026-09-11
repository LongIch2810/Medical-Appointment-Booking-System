import assert from "node:assert/strict";
import test from "node:test";
import {
  AnalyzeSymptomsTool,
  symptomArraySchema,
} from "../../../src/tools/symptoms_analyzer.tool.js";

test("symptomArraySchema accepts an array of well-formed symptom entries", () => {
  const result = symptomArraySchema.safeParse([
    { id: "1", symptoms_name: "Ho" },
    { id: "2", symptoms_name: "Sốt cao" },
  ]);
  assert.equal(result.success, true);
});

test("symptomArraySchema accepts an empty array (no symptoms found)", () => {
  assert.equal(symptomArraySchema.safeParse([]).success, true);
});

test("symptomArraySchema rejects an entry with an empty id", () => {
  const result = symptomArraySchema.safeParse([
    { id: "", symptoms_name: "Ho" },
  ]);
  assert.equal(result.success, false);
});

test("symptomArraySchema rejects an entry with an empty symptoms_name", () => {
  const result = symptomArraySchema.safeParse([
    { id: "1", symptoms_name: "" },
  ]);
  assert.equal(result.success, false);
});

test("symptomArraySchema rejects an entry missing a required field", () => {
  assert.equal(
    symptomArraySchema.safeParse([{ id: "1" }]).success,
    false,
  );
  assert.equal(
    symptomArraySchema.safeParse([{ symptoms_name: "Ho" }]).success,
    false,
  );
});

test("symptomArraySchema rejects a non-array value", () => {
  assert.equal(
    symptomArraySchema.safeParse({ id: "1", symptoms_name: "Ho" }).success,
    false,
  );
});

// AnalyzeSymptomsTool's func itself is thin LLM-prompt wiring on top of the
// schema above (no other branch logic, no exported helpers), so beyond the
// schema coverage this is a registration smoke test.
test("analyze_symptoms_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(AnalyzeSymptomsTool.name, "analyze_symptoms_tool");
  assert.equal(typeof AnalyzeSymptomsTool.description, "string");
  assert.ok(AnalyzeSymptomsTool.description.length > 0);
});

test("analyze_symptoms_tool's input schema requires a string `text_input`", () => {
  assert.equal(
    AnalyzeSymptomsTool.schema.safeParse({
      text_input: "Tôi bị Ho, sốt cao, đau đầu",
    }).success,
    true,
  );
  assert.equal(AnalyzeSymptomsTool.schema.safeParse({}).success, false);
});
