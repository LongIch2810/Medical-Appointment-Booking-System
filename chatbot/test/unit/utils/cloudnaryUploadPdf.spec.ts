import assert from "node:assert/strict";
import test from "node:test";
import cloudinary from "../../../src/configs/cloudinary.js";
import { uploadPdfToCloudinary } from "../../../src/utils/cloudnaryUploadPdf.js";

// cloudinary.uploader.upload is a real network call — mock it at the SDK
// boundary (the singleton `cloudinary` object) instead of hitting the network.
// (This repo's --loader ts-node/esm test runner can't use node:test's
// mock.module(), so object/prototype-method mocking is the established
// pattern here — see diagnosis.graph.spec.ts.)

test("uploads the given file path as a raw PDF and returns its secure URL/public_id", async (t) => {
  const uploadMock = t.mock.method(cloudinary.uploader, "upload", async () => ({
    secure_url: "https://res.cloudinary.com/demo/raw/upload/v1/pdfs/report.pdf",
    public_id: "pdfs/report",
  }));

  const result = await uploadPdfToCloudinary("/tmp/report.pdf");

  assert.equal(uploadMock.mock.callCount(), 1);
  const [filePath, options] = uploadMock.mock.calls[0].arguments;
  assert.equal(filePath, "/tmp/report.pdf");
  assert.deepEqual(options, {
    resource_type: "raw",
    folder: "pdfs",
    format: "pdf",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  assert.deepEqual(result, {
    url: "https://res.cloudinary.com/demo/raw/upload/v1/pdfs/report.pdf",
    public_id: "pdfs/report",
  });
});

test("propagates an upload failure instead of swallowing it", async (t) => {
  t.mock.method(cloudinary.uploader, "upload", async () => {
    throw new Error("cloudinary is down");
  });

  await assert.rejects(
    uploadPdfToCloudinary("/tmp/report.pdf"),
    /cloudinary is down/,
  );
});
