import assert from "node:assert/strict";
import test from "node:test";
import {
  ReportSchema,
  WriteProfessionalReportTool,
} from "../../../src/tools/write_professional_report.tool.js";

const validReport = {
  title: "Báo cáo phân tích cơ cấu độ tuổi bác sĩ",
  analysis: [
    { section_title: "Tổng quan", content: "Nội dung phân tích tổng quan." },
  ],
  insights: ["Đội ngũ bác sĩ trẻ đang tăng trưởng."],
  strategic_recommendations: ["Đầu tư đào tạo chuyên sâu."],
  economic_context: "Bối cảnh kinh tế vĩ mô ổn định.",
  footer: "AI LifeHealth",
};

test("ReportSchema accepts a fully-populated report", () => {
  assert.equal(ReportSchema.safeParse(validReport).success, true);
});

test("ReportSchema rejects a report missing a required top-level field (title)", () => {
  const { title, ...rest } = validReport;
  assert.equal(ReportSchema.safeParse(rest).success, false);
});

test("ReportSchema rejects an analysis entry missing `content`", () => {
  const invalid = {
    ...validReport,
    analysis: [{ section_title: "Tổng quan" }],
  };
  assert.equal(ReportSchema.safeParse(invalid).success, false);
});

test("ReportSchema rejects non-array `insights`", () => {
  const invalid = { ...validReport, insights: "not an array" };
  assert.equal(ReportSchema.safeParse(invalid).success, false);
});

// WriteProfessionalReportTool's func itself is thin LLM-prompt wiring on top
// of ReportSchema (pipes { question, data_json } through a fixed prompt into
// a structured-output LLM call, no other branch logic), so beyond the schema
// coverage above this is a registration smoke test.
test("write_professional_report_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(
    WriteProfessionalReportTool.name,
    "write_professional_report_tool",
  );
  assert.equal(typeof WriteProfessionalReportTool.description, "string");
  assert.ok(WriteProfessionalReportTool.description.length > 0);
});

test("write_professional_report_tool's input schema requires string `question` and `data_json`", () => {
  assert.equal(
    WriteProfessionalReportTool.schema.safeParse({
      question: "Phân tích cơ cấu độ tuổi của bác sĩ",
      data_json: "[]",
    }).success,
    true,
  );
  assert.equal(
    WriteProfessionalReportTool.schema.safeParse({ question: "abc" })
      .success,
    false,
  );
});
