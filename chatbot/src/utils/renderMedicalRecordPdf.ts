import { createCanvas } from "canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ChatbotOperationError } from "./retry.js";

export const MAX_MEDICAL_RECORD_PDF_PAGES = 5;

export type NormalizedMedicalRecordFile = {
  mimetype: "image/png";
  buffer: Buffer;
};

function invalidPdf(message: string, cause?: unknown): never {
  throw new ChatbotOperationError({
    status: 400,
    code: "INVALID_MEDICAL_RECORD_PDF",
    message,
    retryable: false,
    cause,
  });
}

/** Converts a PDF to the same PNG inputs used by the vision OCR path. */
export async function renderMedicalRecordPdf(
  file: Express.Multer.File,
): Promise<NormalizedMedicalRecordFile[]> {
  if (file.buffer.length === 0) {
    invalidPdf("The uploaded PDF is empty.");
  }

  let document;
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(file.buffer),
    });
    document = await loadingTask.promise;
  } catch (error) {
    invalidPdf("The uploaded PDF could not be read.", error);
  }

  try {
    if (document.numPages < 1) {
      invalidPdf("The uploaded PDF has no pages.");
    }
    if (document.numPages > MAX_MEDICAL_RECORD_PDF_PAGES) {
      invalidPdf(
        `The uploaded PDF exceeds the ${MAX_MEDICAL_RECORD_PDF_PAGES}-page limit.`,
      );
    }

    const pages: NormalizedMedicalRecordFile[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as never,
        viewport,
      }).promise;
      page.cleanup();
      pages.push({
        mimetype: "image/png",
        buffer: canvas.toBuffer("image/png"),
      });
    }

    return pages;
  } catch (error) {
    if (error instanceof ChatbotOperationError) throw error;
    invalidPdf("The uploaded PDF could not be rendered.", error);
  } finally {
    await document.destroy();
  }
}
