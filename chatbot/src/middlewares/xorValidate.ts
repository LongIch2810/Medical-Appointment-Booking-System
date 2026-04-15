import { NextFunction, Request, Response } from "express";

export function xorValidate(req: Request, res: Response, next: NextFunction) {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const images = files?.images ?? [];
  const pdfs = files?.pdf ?? [];

  // bắt buộc đúng 1 trong 2
  const hasImages = images.length > 0;
  const hasPdf = pdfs.length > 0;

  if (hasImages && hasPdf) {
    res.status(400).json({
      message: "Chỉ được gửi images hoặc pdf, không được gửi cả hai.",
    });
  }
  if (!hasImages && !hasPdf) {
    res.status(400).json({ message: "Phải gửi ít nhất images hoặc pdf." });
  }

  if (hasImages) {
    const bad = images.find((f) => !f.mimetype.startsWith("image/"));
    if (bad)
      res
        .status(400)
        .json({ message: `File không phải ảnh: ${bad.originalname}` });
  }

  if (hasPdf) {
    const pdf = pdfs[0];
    if (pdf.mimetype !== "application/pdf") {
      res
        .status(400)
        .json({ message: `File pdf không hợp lệ: ${pdf.originalname}` });
    }
  }

  (req as any).fileParams = hasImages
    ? { imageFiles: images }
    : { pdfFile: pdfs[0] };

  next();
}
