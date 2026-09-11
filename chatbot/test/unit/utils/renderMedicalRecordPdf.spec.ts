import assert from "node:assert/strict";
import test from "node:test";
import { createCanvas } from "canvas";
import {
  MAX_MEDICAL_RECORD_PDF_PAGES,
  renderMedicalRecordPdf,
} from "../../../src/utils/renderMedicalRecordPdf.js";

function pdfWithPages(pageCount: number): Buffer {
  const canvas = createCanvas(100, 100, "pdf");
  const context = canvas.getContext("2d");
  for (let index = 0; index < pageCount; index += 1) {
    context.fillText(`page ${index + 1}`, 10, 20);
    if (index + 1 < pageCount) context.addPage();
  }
  return canvas.toBuffer();
}

function pdfFile(buffer: Buffer): Express.Multer.File {
  return {
    originalname: "record.pdf",
    mimetype: "application/pdf",
    buffer,
  } as Express.Multer.File;
}

test("renders every accepted PDF page as a PNG vision input", async () => {
  const pages = await renderMedicalRecordPdf(pdfFile(pdfWithPages(2)));
  assert.equal(pages.length, 2);
  for (const page of pages) {
    assert.equal(page.mimetype, "image/png");
    assert.ok(
      page.buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    );
  }
});

test("rejects unreadable PDFs and PDFs over the page limit", async () => {
  await assert.rejects(
    renderMedicalRecordPdf(pdfFile(Buffer.from("not a PDF"))),
    { code: "INVALID_MEDICAL_RECORD_PDF" },
  );
  await assert.rejects(
    renderMedicalRecordPdf(
      pdfFile(pdfWithPages(MAX_MEDICAL_RECORD_PDF_PAGES + 1)),
    ),
    { code: "INVALID_MEDICAL_RECORD_PDF" },
  );
});
