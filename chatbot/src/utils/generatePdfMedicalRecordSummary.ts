import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { uploadPdfToCloudinary } from "./cloudnaryUploadPdf.js";
import { sanitizeAiDocumentFileName } from "./aiDocumentFileName.js";

export const generatePdfMedicalRecordSummary = async (
  summary: string,
  fileName?: string,
) => {
  const tmpDir = path.resolve(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outputPath = path.join(
    tmpDir,
    sanitizeAiDocumentFileName(fileName, `tom-tat-benh-an-${Date.now()}`),
  );
  try {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    doc.fontSize(20).fillColor("#1A237E").text("TÓM TẮT BỆNH ÁN", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(11).fillColor("black").text(summary, { align: "left", lineGap: 4 });
    doc.moveDown(2);
    doc.fontSize(9).fillColor("gray").text("Tài liệu được tạo tự động bởi AI. Vui lòng trao đổi với nhân viên y tế để được tư vấn.", { align: "center" });
    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
    return await uploadPdfToCloudinary(outputPath);
  } finally {
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
};
