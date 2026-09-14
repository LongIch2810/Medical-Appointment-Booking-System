import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import cloudinary from "../../../src/configs/cloudinary.js";
import { generatePdfHealthRoadmap } from "../../../src/utils/generatePdfHealthRoadmap.js";

// pdfkit renders entirely in-process/on local disk (no network), so it runs
// for real here to exercise the actual PDF-writing code path. Only the
// Cloudinary upload — the real network boundary — is mocked, the same way
// cloudnaryUploadPdf.spec.ts mocks it.
//
// A nonexistent chartImagePath is used deliberately: generatePdfHealthRoadmap
// only embeds/deletes the chart image when fs.existsSync(chartImagePath) is
// true, so this both skips image-embedding (out of scope here — covered by
// renderChartToImage.spec.ts) and avoids deleting any real fixture file.

const reportData = {
  title: "Lộ trình cải thiện sức khỏe 6 tháng",
  introduction: "Tổng quan mục tiêu và tình trạng hiện tại.",
  sections: [
    { section_title: "Dinh dưỡng", content: "Ăn nhiều rau xanh." },
    { section_title: "Vận động", content: "Đi bộ 30 phút mỗi ngày." },
  ],
  progress_summary: "Theo dõi tiến độ theo 2 giai đoạn.",
  motivation: "Kiên trì mỗi ngày một chút.",
  conclusion: "Không thay thế chẩn đoán của bác sĩ.",
  footer: "AI LifeHealth",
};

test("renders a PDF, uploads it to Cloudinary, and cleans up the local temp file", async (t) => {
  const uploadMock = t.mock.method(
    cloudinary.uploader,
    "upload",
    async (filePath: string) => {
      await new Promise<void>((resolve) => setImmediate(resolve));
      // Assert the file actually exists (real PDF written to disk) at the moment of upload.
      assert.equal(fs.existsSync(filePath), true);
      assert.equal(path.extname(filePath), ".pdf");
      return {
        public_id: "pdfs/roadmap",
        resource_type: "raw",
        format: "pdf",
        original_filename: "health-roadmap",
        bytes: 321,
      };
    },
  );

  const result = await generatePdfHealthRoadmap(
    reportData,
    path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
    "health-roadmap.pdf",
  );

  assert.equal(uploadMock.mock.callCount(), 1);
  const uploadedPath = uploadMock.mock.calls[0].arguments[0] as string;
  assert.deepEqual(result, {
    publicId: "pdfs/roadmap",
    resourceType: "raw",
    format: "pdf",
    fileName: "health-roadmap.pdf",
    bytes: 321,
  });

  // The function deletes its own temp output file in a `finally` block.
  assert.equal(fs.existsSync(uploadedPath), false);
});

test("propagates a Cloudinary upload failure instead of swallowing it", async (t) => {
  t.mock.method(cloudinary.uploader, "upload", async () => {
    throw new Error("cloudinary is down");
  });

  await assert.rejects(
    generatePdfHealthRoadmap(
      reportData,
      path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
    ),
    /cloudinary is down/,
  );
});

test("still cleans up the temp PDF file even when the upload fails", async (t) => {
  let capturedPath = "";
  t.mock.method(cloudinary.uploader, "upload", async (filePath: string) => {
    capturedPath = filePath;
    throw new Error("network error");
  });

  await assert.rejects(
    generatePdfHealthRoadmap(
      reportData,
      path.resolve(process.cwd(), "tmp", "does-not-exist-chart.png"),
    ),
  );

  assert.ok(capturedPath.length > 0);
  assert.equal(fs.existsSync(capturedPath), false);
});
