import assert from "node:assert/strict";
import test from "node:test";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import loadDocuments from "../../../src/utils/loadDocuments.js";

// PDFLoader#load ultimately reads real files off disk and parses them with
// pdf.js — mock it at the class-prototype boundary so this test doesn't
// depend on real PDF fixtures. `load` is inherited from BufferLoader, but
// assigning PDFLoader.prototype.load creates an own override that shadows it
// (same technique as diagnosis.graph.spec.ts uses for LangChain tools).

test("loads and flattens documents from every file path, in order", async (t) => {
  const seenPaths: string[] = [];
  t.mock.method(PDFLoader.prototype, "load", async function (this: { filePathOrBlob?: string }) {
    // PDFLoader (via BufferLoader) stores the constructor arg as `filePathOrBlob`.
    const filePath = this.filePathOrBlob as string;
    seenPaths.push(filePath);
    return [
      new Document({ pageContent: `content of ${filePath}`, metadata: { source: filePath } }),
    ];
  });

  const result = await loadDocuments(["/docs/a.pdf", "/docs/b.pdf"]);

  assert.deepEqual(seenPaths, ["/docs/a.pdf", "/docs/b.pdf"]);
  assert.equal(result.length, 2);
  assert.equal(result[0].pageContent, "content of /docs/a.pdf");
  assert.equal(result[1].pageContent, "content of /docs/b.pdf");
});

test("flattens loaders that each return multiple documents (e.g. multi-page PDFs)", async (t) => {
  t.mock.method(PDFLoader.prototype, "load", async function (this: { filePathOrBlob?: string }) {
    const filePath = this.filePathOrBlob as string;
    return [
      new Document({ pageContent: `${filePath}-page1` }),
      new Document({ pageContent: `${filePath}-page2` }),
    ];
  });

  const result = await loadDocuments(["/docs/a.pdf"]);

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((d) => d.pageContent),
    ["/docs/a.pdf-page1", "/docs/a.pdf-page2"],
  );
});

test("returns an empty array for an empty list of file paths", async () => {
  const result = await loadDocuments([]);
  assert.deepEqual(result, []);
});

test("propagates a loader failure instead of swallowing it", async (t) => {
  t.mock.method(PDFLoader.prototype, "load", async () => {
    throw new Error("corrupt PDF");
  });

  await assert.rejects(loadDocuments(["/docs/broken.pdf"]), /corrupt PDF/);
});
