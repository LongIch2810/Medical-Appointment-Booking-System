import sharp from "sharp";

export const normalizedImage = async (
  file: Express.Multer.File
): Promise<{ mimetype: string; buffer: Buffer }> => {
  const img = sharp(file.buffer, { failOnError: false }).rotate();
  const meta = await img.metadata();

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const longEdge = Math.max(w, h) || 0;

  // OCR sweet spot: 2000–3000px cạnh dài
  const targetLong = 2400;

  // chỉ upscale nếu ảnh nhỏ
  const scale =
    longEdge > 0 && longEdge < targetLong ? targetLong / longEdge : 1;

  const resizeW = w ? Math.round(w * scale) : undefined;
  const resizeH = h ? Math.round(h * scale) : undefined;

  return {
    mimetype: file.mimetype,
    buffer: await img
      .resize(resizeW, resizeH, { kernel: sharp.kernel.lanczos3 })
      .grayscale()
      .normalize()
      .sharpen(0.8, 0.4, 1.2)
      .png({ compressionLevel: 9 })
      .toBuffer(),
  };
};
