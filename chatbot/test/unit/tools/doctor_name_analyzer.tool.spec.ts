import assert from "node:assert/strict";
import test from "node:test";
import { AnalyzeDoctorTool } from "../../../src/tools/doctor_name_analyzer.tool.js";

// AnalyzeDoctorTool's func is pure LLM-prompt wiring (extract a doctor name via
// structured output) with no branch logic of its own and no exported pure
// helper — the doctorSchema it validates against internally isn't exported
// either. This is a smoke test of the tool's static shape.

test("exposes the expected tool name", () => {
  assert.equal(AnalyzeDoctorTool.name, "analyze_doctor_name_tool");
});

test("description explains it extracts a doctor name and returns '' when absent", () => {
  assert.match(AnalyzeDoctorTool.description, /bác sĩ/);
  assert.match(AnalyzeDoctorTool.description, /''/);
});

test("schema requires a text_input string", () => {
  const valid = AnalyzeDoctorTool.schema.safeParse({
    text_input: "Tôi muốn đặt lịch với bác sĩ Lan.",
  });
  assert.equal(valid.success, true);

  const missing = AnalyzeDoctorTool.schema.safeParse({});
  assert.equal(missing.success, false);
});
