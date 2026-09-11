import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizedImage } from "../../../src/utils/normalizedImage.js";

// sharp/libvips runs entirely in-process (no network/disk I/O beyond the
// in-memory buffer), so it's exercised for real here rather than mocked —
// only the input images are small synthetic buffers to keep this fast.

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const makeFile = (
  buffer: Buffer,
  mimetype = "image/png",
): Express.Multer.File => ({ buffer, mimetype }) as Express.Multer.File;

test("upscales a small image so its long edge reaches the 2400px OCR target", async () => {
  const smallImage = await sharp({
    create: {
      width: 40,
      height: 30,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .png()
    .toBuffer();

  const result = await normalizedImage(makeFile(smallImage));

  assert.equal(result.mimetype, "image/png");
  assert.ok(
    result.buffer.subarray(0, 8).equals(PNG_SIGNATURE),
    "output is not a valid PNG",
  );

  const meta = await sharp(result.buffer).metadata();
  // Original aspect ratio 40:30 (4:3) upscaled so the long edge (width) hits 2400.
  assert.equal(meta.width, 2400);
  assert.equal(meta.height, 1800);
});

test("does not upscale an image whose long edge already meets the target", async () => {
  const wideImage = await sharp({
    create: {
      width: 3000,
      height: 10,
      channels: 3,
      background: { r: 10, g: 10, b: 10 },
    },
  })
    .png()
    .toBuffer();

  const result = await normalizedImage(makeFile(wideImage));

  const meta = await sharp(result.buffer).metadata();
  assert.equal(meta.width, 3000);
  assert.equal(meta.height, 10);
});

test("reports PNG because normalization always re-encodes the output as PNG", async () => {
  const image = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();

  const result = await normalizedImage(makeFile(image, "image/jpeg"));
  assert.equal(result.mimetype, "image/png");
});

test("converts the output pixels to grayscale", async () => {
  const colorImage = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer();

  const result = await normalizedImage(makeFile(colorImage));
  const { data, info } = await sharp(result.buffer)
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.ok(info.channels >= 1);
  if (info.channels >= 3) {
    assert.equal(data[0], data[1]);
    assert.equal(data[1], data[2]);
  }
});
