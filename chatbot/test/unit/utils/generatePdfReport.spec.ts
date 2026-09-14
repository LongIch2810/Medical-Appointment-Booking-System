import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import cloudinary from "../../../src/configs/cloudinary.js";
import { generatePdfReport } from "../../../src/utils/generatePdfReport.js";

// Same approach as generatePdfHealthRoadmap.spec.ts: pdfkit renders for real
// (in-process/local disk, no network); only the Cloudinary upload boundary is
// mocked, and a nonexistent chartImagePath skips image embedding/cleanup.

const fullReportData = {
  title: "Báo cáo phân tích quý 3",
  analysis: [
    { section_title: "Tổng quan", content: "Nội dung tổng quan." },
    { section_title: "Chi tiết", content: "Nội dung chi tiết." },
  ],
  insights: ["Nhận định 1", "Nhận định 2"],
  strategic_recommendations: ["Khuyến nghị 1"],
  economic_context: "Bối cảnh kinh tế vĩ mô ổn định.",
  footer: "AI LifeHealth",
};

test("renders a PDF, uploads it to Cloudinary, and cleans up the local temp file", async (t) => {
  const uploadMock = t.mock.method(
    cloudinary.uploader,
    "upload",
    async (filePath: string) => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      assert.equal(fs.existsSync(filePath), true);
      assert.equal(path.extname(filePath), ".pdf");
      return {
        public_id: "pdfs/report",
        resource_type: "raw",
        format: "pdf",
        original_filename: "quarterly-report",
        bytes: 123,
      };
    },
  );

  const result = await generatePdfReport(
    fullReportData,
    path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
    "quarterly-report.pdf",
  );

  assert.equal(uploadMock.mock.callCount(), 1);
  const uploadedPath = uploadMock.mock.calls[0].arguments[0] as string;
  assert.deepEqual(result, {
    publicId: "pdfs/report",
    resourceType: "raw",
    format: "pdf",
    fileName: "quarterly-report.pdf",
    bytes: 123,
  });
  assert.equal(fs.existsSync(uploadedPath), false);
});

test("renders successfully when the optional insight/recommendation/context sections are empty", async (t) => {
  const uploadMock = t.mock.method(cloudinary.uploader, "upload", async () => ({
    public_id: "pdfs/minimal",
    resource_type: "raw",
    format: "pdf",
    original_filename: "minimal",
    bytes: 45,
  }));

  const minimalReportData = {
    title: "Báo cáo tối giản",
    analysis: [],
    insights: [],
    strategic_recommendations: [],
    economic_context: "",
    footer: "",
  };

  const result = await generatePdfReport(
    minimalReportData,
    path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
  );

  assert.equal(uploadMock.mock.callCount(), 1);
  assert.deepEqual(result, {
    publicId: "pdfs/minimal",
    resourceType: "raw",
    format: "pdf",
    fileName: "minimal.pdf",
    bytes: 45,
  });
});

test("propagates a Cloudinary upload failure instead of swallowing it", async (t) => {
  t.mock.method(cloudinary.uploader, "upload", async () => {
    throw new Error("cloudinary is down");
  });

  await assert.rejects(
    generatePdfReport(
      fullReportData,
      path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
    ),
    /cloudinary is down/,
  );
});
