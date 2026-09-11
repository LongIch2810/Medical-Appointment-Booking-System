import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type SummaryStub = {
  calls: {
    normalize: unknown[];
    pdf: unknown[];
    ocr: unknown[];
    summary: unknown[];
  };
  errorAt?: "normalize" | "ocr" | "summary";
};
const globals = globalThis as typeof globalThis & {
  __SUMMARY_GRAPH_STUB__: SummaryStub;
};

function resetStub() {
  globals.__SUMMARY_GRAPH_STUB__ = {
    calls: { normalize: [], pdf: [], ocr: [], summary: [] },
  };
}
resetStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/langgraph")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../utils/normalizedImage.js": `
    export async function normalizedImage(file) {
      const state = globalThis.__SUMMARY_GRAPH_STUB__;
      state.calls.normalize.push(file);
      if (state.errorAt === "normalize") throw new Error("normalize failed");
      return { mimetype: "image/png", buffer: Buffer.from("normalized-" + file.originalname) };
    }
  `,
  "../utils/renderMedicalRecordPdf.js": `
    export async function renderMedicalRecordPdf(file) {
      const state = globalThis.__SUMMARY_GRAPH_STUB__;
      state.calls.pdf.push(file);
      return [{ mimetype: "image/png", buffer: Buffer.from("rendered-pdf") }];
    }
  `,
  "../tools/ocr.tool.js": `
    export const BenhAnSchema = { parse: (value) => value };
    export const ocrTool = {
      invoke: async (args) => {
        const state = globalThis.__SUMMARY_GRAPH_STUB__;
        state.calls.ocr.push(args);
        if (state.errorAt === "ocr") throw new Error("ocr failed");
        return { hanh_chinh: { ho_ten: "Patient A" } };
      },
    };
  `,
  "../tools/summary_medical_record.tool.js": `
    export const SummaryMedicalRecordSchema = { parse: (value) => value };
    export const summarizeMedicalRecordTool = {
      invoke: async (args) => {
        const state = globalThis.__SUMMARY_GRAPH_STUB__;
        state.calls.summary.push(args);
        if (state.errorAt === "summary") throw new Error("summary failed");
        return { answer: "medical summary" };
      },
    };
  `,
});

const { summaryMedicalRecordGraph } =
  await import("../../../src/langgraph/summary_medical_record.graph.js");

test.beforeEach(resetStub);

test("normalizes images, runs OCR, and summarizes the record end to end", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const imageFiles = [
    {
      originalname: "front.png",
      mimetype: "image/png",
      buffer: Buffer.from("a"),
    },
    {
      originalname: "back.jpg",
      mimetype: "image/jpeg",
      buffer: Buffer.from("b"),
    },
  ] as Express.Multer.File[];

  const result = await summaryMedicalRecordGraph.invoke({
    fileParams: { imageFiles },
  });

  const stub = globals.__SUMMARY_GRAPH_STUB__;
  assert.equal(stub.calls.normalize.length, 2);
  assert.deepEqual(stub.calls.ocr[0], [
    {
      mimetype: "image/png",
      base64: Buffer.from("normalized-front.png").toString("base64"),
    },
    {
      mimetype: "image/png",
      base64: Buffer.from("normalized-back.jpg").toString("base64"),
    },
  ]);
  assert.deepEqual(stub.calls.summary[0], {
    benh_an_json: JSON.stringify({ hanh_chinh: { ho_ten: "Patient A" } }),
  });
  assert.deepEqual(result.summary, { answer: "medical summary" });
});

test("renders a PDF to PNG inputs before OCR", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const pdfFile = {
    mimetype: "application/pdf",
    buffer: Buffer.from("pdf"),
  } as Express.Multer.File;

  await summaryMedicalRecordGraph.invoke({ fileParams: { pdfFile } });

  const stub = globals.__SUMMARY_GRAPH_STUB__;
  assert.equal(stub.calls.normalize.length, 0);
  assert.equal(stub.calls.pdf.length, 1);
  assert.deepEqual(stub.calls.ocr[0], [
    {
      mimetype: "image/png",
      base64: Buffer.from("rendered-pdf").toString("base64"),
    },
  ]);
});

test("stops before summarization when OCR fails", async (t) => {
  t.mock.method(console, "log", () => undefined);
  globals.__SUMMARY_GRAPH_STUB__.errorAt = "ocr";

  await assert.rejects(
    summaryMedicalRecordGraph.invoke({
      fileParams: {
        imageFiles: [
          {
            originalname: "record.png",
            mimetype: "image/png",
            buffer: Buffer.from("image"),
          } as Express.Multer.File,
        ],
      },
    }),
    /ocr failed/,
  );
  assert.equal(globals.__SUMMARY_GRAPH_STUB__.calls.summary.length, 0);
});
