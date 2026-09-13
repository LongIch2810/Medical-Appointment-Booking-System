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
    return;
  }
  if (!hasImages && !hasPdf) {
    res.status(400).json({ message: "Phải gửi ít nhất images hoặc pdf." });
    return;
  }

  if (hasImages) {
    const bad = images.find((file) => !isSupportedImage(file));
    if (bad) {
      res.status(400).json({
        message: `File ảnh không hợp lệ hoặc không được hỗ trợ: ${bad.originalname}`,
      });
      return;
    }
  }

  if (hasPdf) {
    const pdf = pdfs[0];
    if (!isPdf(pdf)) {
      res.status(400).json({
        message: `File pdf không hợp lệ: ${pdf.originalname}`,
      });
      return;
    }
  }

  const outputFileName =
    typeof req.body?.outputFileName === "string"
      ? req.body.outputFileName
      : undefined;

  (req as any).fileParams = hasImages
    ? { imageFiles: images, ...(outputFileName ? { outputFileName } : {}) }
    : { pdfFile: pdfs[0], ...(outputFileName ? { outputFileName } : {}) };

  next();
}

const IMAGE_SIGNATURES: Array<{
  mimeType: string;
  matches: (buffer: Buffer) => boolean;
}> = [
  {
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  },
  {
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

function isSupportedImage(file: Express.Multer.File): boolean {
  return IMAGE_SIGNATURES.some(
    ({ mimeType, matches }) =>
      file.mimetype === mimeType && matches(file.buffer),
  );
}

function isPdf(file: Express.Multer.File): boolean {
  return (
    file.mimetype === "application/pdf" &&
    file.buffer.length >= 5 &&
    file.buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}
