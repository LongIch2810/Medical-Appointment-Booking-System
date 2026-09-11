import assert from "node:assert/strict";
import test from "node:test";
import { AnalyzeSpecialtyTool } from "../../../src/tools/specialty_name_analyzer.tool.js";

// AnalyzeSpecialtyTool's func is LLM-prompt wiring around two network calls
// (fetchSpecialties() -> axios.post to the backend, and the structured LLM
// diagnosis call) plus a private, unexported normalize()/matching step. None
// of those helpers (normalize, fetchSpecialties, buildSystemPrompt) are
// exported, and the func itself can't be exercised without hitting a real
// backend + LLM (no DI seam, and this repo's ESM test runner has no working
// module-mocking option — see qa_sql.tool.spec.ts for the full explanation of
// why mock.module() isn't viable here). So this is a minimal smoke test of
// the tool's registration/schema rather than its branch logic.
test("analyze_specialty_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(AnalyzeSpecialtyTool.name, "analyze_specialty_tool");
  assert.equal(typeof AnalyzeSpecialtyTool.description, "string");
  assert.ok(AnalyzeSpecialtyTool.description.length > 0);
});

test("analyze_specialty_tool's input schema requires a string `text_input`", () => {
  assert.equal(
    AnalyzeSpecialtyTool.schema.safeParse({
      text_input: "Tôi muốn khám chuyên khoa nhi.",
    }).success,
    true,
  );
  assert.equal(AnalyzeSpecialtyTool.schema.safeParse({}).success, false);
  assert.equal(
    AnalyzeSpecialtyTool.schema.safeParse({ text_input: 42 }).success,
    false,
  );
});
