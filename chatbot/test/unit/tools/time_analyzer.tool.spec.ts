import assert from "node:assert/strict";
import test from "node:test";
import { AnalyzeTimeTool } from "../../../src/tools/time_analyzer.tool.js";

// AnalyzeTimeTool's func is thin LLM-prompt wiring (fixed prompt template ->
// structured-output LLM call, no branch logic and no exported helpers —
// dateTimeSchema itself isn't exported). Exercising it for real would require
// a live LLM endpoint. This is a minimal smoke test of the tool's
// registration/schema.
test("analyze_time_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(AnalyzeTimeTool.name, "analyze_time_tool");
  assert.equal(typeof AnalyzeTimeTool.description, "string");
  assert.ok(AnalyzeTimeTool.description.length > 0);
});

test("analyze_time_tool's input schema requires a string `text_input`", () => {
  assert.equal(
    AnalyzeTimeTool.schema.safeParse({
      text_input: "Tôi muốn đặt lịch khám vào sáng mai.",
    }).success,
    true,
  );
  assert.equal(AnalyzeTimeTool.schema.safeParse({}).success, false);
  assert.equal(
    AnalyzeTimeTool.schema.safeParse({ text_input: 7 }).success,
    false,
  );
});
