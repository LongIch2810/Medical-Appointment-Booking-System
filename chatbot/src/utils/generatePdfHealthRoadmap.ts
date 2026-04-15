import PDFDocument from "pdfkit";
import fs from "fs";
import { z } from "zod";
import path from "path";
import { HealthRoadmapReportSchema } from "../tools/write_health_roadmap.tool.js";
import { uploadPdfToCloudinary } from "./cloudnaryUploadPdf.js";

type HealthRoadmapReport = z.infer<typeof HealthRoadmapReportSchema>;

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
export const generatePdfHealthRoadmap = async (
  HealthRoadmapReportData: HealthRoadmapReport,
  chartImagePath: string
): Promise<{ url: string; public_id: string }> => {
  const tmpDir = path.resolve(process.cwd(), "tmp");
  ensureDir(tmpDir);
  const outputPath = path.join(
    tmpDir,
    `report_health_roadmap-${Date.now()}.pdf`
  );

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  //Đăng ký font Roboto (nếu có)
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
      "⚠️ Không tìm thấy font Roboto, sẽ dùng font mặc định (có thể lỗi dấu tiếng Việt)."
    );
  }

  //Tiêu đề chính
  doc
    .font("Roboto-Bold")
    .fontSize(20)
    .fillColor("#1A237E")
    .text(HealthRoadmapReportData.title.toUpperCase(), { align: "center" });
  doc.moveDown(2);

  //Giới thiệu tổng quan
  doc
    .font("Roboto")
    .fontSize(12)
    .fillColor("black")
    .text(HealthRoadmapReportData.introduction, { align: "justify" });
  doc.moveDown(1.5);

  //Biểu đồ tiến trình nếu có
  if (chartImagePath && fs.existsSync(chartImagePath)) {
    doc.image(chartImagePath, {
      fit: [450, 250],
      align: "center",
      valign: "center",
    });
    doc.moveDown(2);
  }

  //Các phần nội dung chính
  doc.font("Roboto-Bold").fontSize(14).fillColor("#1565C0");
  doc.text("CÁC PHẦN CHÍNH CỦA LỘ TRÌNH", { underline: true });
  doc.moveDown(1);

  HealthRoadmapReportData.sections.forEach((section, idx) => {
    doc
      .font("Roboto-Bold")
      .fontSize(12)
      .fillColor("#0D47A1")
      .text(`${idx + 1}. ${section.section_title}`, { underline: true });
    doc.moveDown(0.4);
    doc
      .font("Roboto")
      .fontSize(11)
      .fillColor("black")
      .text(section.content, { align: "justify" });
    doc.moveDown(1);
  });

  //Tổng kết tiến trình
  doc
    .font("Roboto-Bold")
    .fontSize(14)
    .fillColor("#1565C0")
    .text("TỔNG KẾT TIẾN TRÌNH");
  doc.moveDown(0.5);
  doc
    .font("Roboto")
    .fontSize(11)
    .fillColor("black")
    .text(HealthRoadmapReportData.progress_summary, { align: "justify" });
  doc.moveDown(1);

  // 💬 Lời động viên
  doc
    .font("Roboto-Bold")
    .fontSize(14)
    .fillColor("#1565C0")
    .text("ĐỘNG VIÊN & TRUYỀN CẢM HỨNG");
  doc.moveDown(0.5);
  doc
    .font("Roboto-Italic")
    .fontSize(12)
    .fillColor("#2E7D32")
    .text(`“${HealthRoadmapReportData.motivation}”`, {
      align: "center",
    });
  doc.moveDown(1);

  //Kết luận
  doc
    .font("Roboto-Bold")
    .fontSize(14)
    .fillColor("#1565C0")
    .text("KẾT LUẬN & LỜI KHUYÊN TỔNG THỂ");
  doc.moveDown(0.5);
  doc
    .font("Roboto")
    .fontSize(11)
    .fillColor("black")
    .text(HealthRoadmapReportData.conclusion, { align: "justify" });
  doc.moveDown(2);

  // 🕓 Footer
  doc
    .font("Roboto-Italic")
    .fontSize(10)
    .fillColor("gray")
    .text(
      HealthRoadmapReportData.footer ||
        "Bản lộ trình được tạo tự động bởi AI Health Coach.",
      { align: "center" }
    );

  // ✍️ Kết thúc
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
