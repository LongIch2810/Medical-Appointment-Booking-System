import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ChatbotOperationError } from "./retry.js";

export const MAX_MEDICAL_RECORD_PDF_PAGES = 5;

export type PreparedMedicalRecordPdf = {
  mimetype: "application/pdf";
  base64: string;
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

/** Validates a PDF and hands it to the vision model as-is (no rasterization). */
export async function prepareMedicalRecordPdf(
  file: Express.Multer.File,
): Promise<PreparedMedicalRecordPdf> {
  if (file.buffer.length === 0) {
    invalidPdf("The uploaded PDF is empty.");
  }

  let document;
  try {
    const loadingTask = getDocument({ data: new Uint8Array(file.buffer) });
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
  } finally {
    await document.destroy();
  }

  return { mimetype: "application/pdf", base64: file.buffer.toString("base64") };
}
