import assert from "node:assert/strict";
import test from "node:test";
import { medicalConsultationTool } from "../../../src/tools/medical_consultation.tool.js";
import { detectEmergencyRedFlags } from "../../../src/tools/medical_consultation.tool.js";

// medicalConsultationTool's func is a one-line passthrough to the LLM
// (`medicalLLM.invoke(question)` → `res.content`) with no branch logic and no
// exported pure helper. This is a smoke test of the tool's static shape.

test("exposes the expected tool name", () => {
  assert.equal(medicalConsultationTool.name, "medical_consultation_tool");
});

test("description warns it is reference-only and not a substitute for a doctor", () => {
  assert.match(medicalConsultationTool.description, /không thay thế/);
});

test("schema requires a question string", () => {
  const valid = medicalConsultationTool.schema.safeParse({
    question: "Đau đầu nên uống thuốc gì?",
  });
  assert.equal(valid.success, true);

  const missing = medicalConsultationTool.schema.safeParse({});
  assert.equal(missing.success, false);
});

// detectEmergencyRedFlags: deterministic keyword check run independently of
// the LLM, covering the exact scenarios the task calls out (chest pain,
// difficulty breathing, stroke, overdose, suicide) plus negative cases so it
// doesn't fire on ordinary medication questions.
test("detects chest pain as an emergency red flag", () => {
  assert.equal(detectEmergencyRedFlags("Tôi bị đau ngực dữ dội"), true);
  assert.equal(detectEmergencyRedFlags("I have severe chest pain"), true);
});

test("detects difficulty breathing as an emergency red flag", () => {
  assert.equal(detectEmergencyRedFlags("Tôi cảm thấy khó thở"), true);
  assert.equal(
    detectEmergencyRedFlags("I am having difficulty breathing"),
    true,
  );
});

test("detects stroke symptoms as an emergency red flag", () => {
  assert.equal(
    detectEmergencyRedFlags("Bố tôi bị méo miệng và nói ngọng đột ngột"),
    true,
  );
  assert.equal(
    detectEmergencyRedFlags("His speech is slurred and face is drooping"),
    true,
  );
});

test("detects overdose as an emergency red flag", () => {
  assert.equal(detectEmergencyRedFlags("Con tôi uống quá liều thuốc"), true);
  assert.equal(detectEmergencyRedFlags("I think I took an overdose"), true);
});

test("detects suicidal ideation as an emergency red flag", () => {
  assert.equal(detectEmergencyRedFlags("Tôi muốn tự tử"), true);
  assert.equal(
    detectEmergencyRedFlags("I feel like I want to kill myself"),
    true,
  );
});

test("does not flag an ordinary medication question", () => {
  assert.equal(
    detectEmergencyRedFlags("Thuốc paracetamol uống mấy lần một ngày?"),
    false,
  );
  assert.equal(
    detectEmergencyRedFlags("What is the dosage for ibuprofen?"),
    false,
  );
});

test("does not flag an ordinary symptom question", () => {
  assert.equal(detectEmergencyRedFlags("Tôi bị đau đầu nhẹ"), false);
  assert.equal(detectEmergencyRedFlags("I have a mild headache"), false);
});
