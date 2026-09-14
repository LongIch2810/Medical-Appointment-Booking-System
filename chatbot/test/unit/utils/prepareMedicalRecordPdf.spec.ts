import assert from "node:assert/strict";
import test from "node:test";
import { createCanvas } from "canvas";
import {
  MAX_MEDICAL_RECORD_PDF_PAGES,
  prepareMedicalRecordPdf,
} from "../../../src/utils/prepareMedicalRecordPdf.js";

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

test("returns the original PDF bytes as base64 for a valid PDF within the page limit", async () => {
  const buffer = pdfWithPages(2);
  const result = await prepareMedicalRecordPdf(pdfFile(buffer));

  assert.deepEqual(result, {
    mimetype: "application/pdf",
    base64: buffer.toString("base64"),
  });
});

test("rejects unreadable PDFs and PDFs over the page limit", async () => {
  await assert.rejects(
    prepareMedicalRecordPdf(pdfFile(Buffer.from("not a PDF"))),
    { code: "INVALID_MEDICAL_RECORD_PDF" },
  );
  await assert.rejects(
    prepareMedicalRecordPdf(
      pdfFile(pdfWithPages(MAX_MEDICAL_RECORD_PDF_PAGES + 1)),
    ),
    { code: "INVALID_MEDICAL_RECORD_PDF" },
  );
});

test("rejects an empty PDF buffer", async () => {
  await assert.rejects(
    prepareMedicalRecordPdf(pdfFile(Buffer.alloc(0))),
    { code: "INVALID_MEDICAL_RECORD_PDF" },
  );
});
