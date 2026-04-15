import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { ReportSchema as ReportZodSchema } from "../tools/write_professional_report.tool.js";
import { uploadPdfToCloudinary } from "./cloudnaryUploadPdf.js";

type Report = z.infer<typeof ReportZodSchema>;

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

/**
 * Tạo báo cáo PDF tiếng Việt có biểu đồ và nội dung chuyên nghiệp
 */
export const generatePdfReport = async (
  reportData: Report,
  chartImagePath: string
): Promise<{ url: string; public_id: string }> => {
  const tmpDir = path.resolve(process.cwd(), "tmp");
  ensureDir(tmpDir);
  const outputPath = path.join(tmpDir, `report-${Date.now()}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const regularFontPath = path.resolve("src/fonts/Roboto-Regular.ttf");
  const boldFontPath = path.resolve("src/fonts/Roboto-Bold.ttf");
  const italicFontPath = path.resolve("src/fonts/Roboto-Italic.ttf");

  if (
    fs.existsSync(regularFontPath) &&
    fs.existsSync(boldFontPath) &&
    fs.existsSync(italicFontPath)
  ) {
    doc.registerFont("Roboto", regularFontPath);
    doc.registerFont("Roboto-Bold", boldFontPath);
    doc.registerFont("Roboto-Italic", italicFontPath);
    doc.font("Roboto");
  } else {
    console.warn(
      "Không tìm thấy font Roboto, sẽ dùng font mặc định của PDFKit (có thể lỗi dấu)."
    );
  }

  //Tiêu đề
  doc
    .font("Roboto-Bold")
    .fontSize(20)
    .fillColor("#1A237E")
    .text(reportData.title.toUpperCase(), { align: "center" });
  doc.moveDown(2);

  //Hình biểu đồ
  if (chartImagePath && fs.existsSync(chartImagePath)) {
    doc.image(chartImagePath, {
      fit: [450, 250],
      align: "center",
      valign: "center",
    });
    doc.moveDown(1.5);
  }

  //Các phần phân tích
  doc.font("Roboto-Bold").fontSize(14).fillColor("#1565C0").text("Phân tích");
  doc.moveDown(1);
  reportData.analysis?.forEach((section: any, index: number) => {
    doc
      .font("Roboto-Bold")
      .fontSize(12)
      .fillColor("#0D47A1")
      .text(`${index + 1}. ${section.section_title}`, { underline: true });
    doc.moveDown(0.3);
    doc
      .font("Roboto")
      .fontSize(10)
      .fillColor("black")
      .text(section.content, { align: "justify" });
    doc.moveDown(1);
  });

  //Nhận định chính
  if (reportData.insights?.length) {
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .fillColor("#1565C0")
      .text("NHẬN ĐỊNH CHÍNH");
    doc.moveDown(0.5);
    doc.font("Roboto").fontSize(12).fillColor("black");
    reportData.insights.forEach((i: string) => doc.text(`• ${i}`));
    doc.moveDown(1);
  }

  //Khuyến nghị chiến lược
  if (reportData.strategic_recommendations?.length) {
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .fillColor("#1565C0")
      .text("KHUYẾN NGHỊ CHIẾN LƯỢC");
    doc.moveDown(0.5);
    doc.font("Roboto").fontSize(12).fillColor("black");
    reportData.strategic_recommendations.forEach((r: string) =>
      doc.text(`• ${r}`)
    );
    doc.moveDown(1);
  }

  //Bối cảnh kinh tế
  if (reportData.economic_context) {
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .fillColor("#1565C0")
      .text("BỐI CẢNH KINH TẾ");
    doc.moveDown(0.5);
    doc
      .font("Roboto")
      .fontSize(12)
      .fillColor("black")
      .text(reportData.economic_context, { align: "justify" });
    doc.moveDown(1);
  }

  //Footer
  doc
    .moveDown(1.5)
    .font("Roboto-Italic")
    .fontSize(10)
    .fillColor("gray")
    .text(reportData.footer || "Báo cáo được tạo tự động bởi hệ thống AI.", {
      align: "center",
    });

  //Kết thúc và lưu file
  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  try {
    const { url, public_id } = await uploadPdfToCloudinary(outputPath);
    return { url, public_id };
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(chartImagePath)) fs.unlinkSync(chartImagePath);
    } catch {}
  }
};
