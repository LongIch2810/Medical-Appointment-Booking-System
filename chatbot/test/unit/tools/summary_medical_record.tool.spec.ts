import assert from "node:assert/strict";
import test from "node:test";
import { summarizeMedicalRecordTool } from "../../../src/tools/summary_medical_record.tool.js";

// summarizeMedicalRecordTool is thin LLM-prompt wiring: its func just pipes
// { benh_an_json } through a fixed ChatPromptTemplate into a structured-output
// LLM call. There's no independently-testable branch logic (no exported
// helpers, no validation beyond "is a string"), and invoking the pipeline for
// real would require a live LLM endpoint. This is a minimal smoke test of the
// tool's registration/schema rather than a forced test of LLM output.
test("summary_medical_record_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(
    summarizeMedicalRecordTool.name,
    "summary_medical_record_tool",
  );
  assert.equal(typeof summarizeMedicalRecordTool.description, "string");
  assert.ok(summarizeMedicalRecordTool.description.length > 0);
});

test("summary_medical_record_tool's input schema requires a string `benh_an_json`", () => {
  assert.equal(
    summarizeMedicalRecordTool.schema.safeParse({ benh_an_json: "{}" })
      .success,
    true,
  );
  assert.equal(
    summarizeMedicalRecordTool.schema.safeParse({}).success,
    false,
  );
  assert.equal(
    summarizeMedicalRecordTool.schema.safeParse({ benh_an_json: 123 })
      .success,
    false,
  );
});
