import assert from "node:assert/strict";
import test from "node:test";
import cloudinary from "../../../src/configs/cloudinary.js";
import { uploadPdfToCloudinary } from "../../../src/utils/cloudnaryUploadPdf.js";

// cloudinary.uploader.upload is a real network call — mock it at the SDK
// boundary (the singleton `cloudinary` object) instead of hitting the network.
// (This repo's --loader ts-node/esm test runner can't use node:test's
// mock.module(), so object/prototype-method mocking is the established
// pattern here — see diagnosis.graph.spec.ts.)

test("uploads an authenticated raw PDF and returns its filename descriptor", async (t) => {
  const uploadMock = t.mock.method(cloudinary.uploader, "upload", async () => ({
    original_filename: "requested-report.pdf",
    public_id: "ai-documents/results/requested-report",
    resource_type: "raw",
    format: "pdf",
    bytes: 321,
  }));

  const result = await uploadPdfToCloudinary("/tmp/report.pdf");

  assert.equal(uploadMock.mock.callCount(), 1);
  const [filePath, options] = uploadMock.mock.calls[0].arguments;
  assert.equal(filePath, "/tmp/report.pdf");
  assert.deepEqual(options, {
    resource_type: "raw",
    type: "authenticated",
    folder: "ai-documents/results",
    format: "pdf",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  assert.deepEqual(result, {
    publicId: "ai-documents/results/requested-report",
    resourceType: "raw",
    format: "pdf",
    fileName: "requested-report.pdf",
    bytes: 321,
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
