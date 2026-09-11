import assert from "node:assert/strict";
import test from "node:test";
import { Document } from "@langchain/core/documents";
import splitDocuments from "../../../src/utils/splitDocuments.js";

// RecursiveCharacterTextSplitter is pure/CPU-only (no I/O or network), so it
// runs for real here rather than being mocked.

test("returns an empty array when given no documents", async () => {
  const result = await splitDocuments([]);
  assert.deepEqual(result, []);
});

test("does not split content shorter than the chunk size", async () => {
  const doc = new Document({ pageContent: "short text", metadata: { source: "a" } });
  const result = await splitDocuments([doc]);

  assert.equal(result.length, 1);
  assert.equal(result[0].pageContent, "short text");
  assert.equal(result[0].metadata.source, "a");
});

test("splits content longer than the configured chunk size (100) into multiple overlapping chunks", async () => {
  const longText = Array.from({ length: 10 }, (_, i) => `Sentence number ${i} in the document.`).join(" ");
  const doc = new Document({ pageContent: longText, metadata: { source: "long" } });

  const result = await splitDocuments([doc]);

  assert.ok(result.length > 1, "expected the long document to be split into more than one chunk");
  for (const chunk of result) {
    assert.ok(chunk.pageContent.length <= 100, `chunk exceeded 100 chars: ${chunk.pageContent.length}`);
    assert.equal(chunk.metadata.source, "long");
  }
});

test("preserves per-document metadata across chunks from multiple documents", async () => {
  const docA = new Document({ pageContent: "Document A content", metadata: { source: "a" } });
  const docB = new Document({ pageContent: "Document B content", metadata: { source: "b" } });

  const result = await splitDocuments([docA, docB]);

  assert.ok(result.some((d) => d.metadata.source === "a"));
  assert.ok(result.some((d) => d.metadata.source === "b"));
});

test("stamps each chunk with a content checksum and a stable point id equal to document.id", async () => {
  const doc = new Document({ pageContent: "short text", metadata: { source: "a" } });
  const [chunk] = await splitDocuments([doc]);

  assert.equal(typeof chunk.metadata.checksum, "string");
  assert.equal((chunk.metadata.checksum as string).length, 64, "sha256 hex digest is 64 chars");
  assert.equal(typeof chunk.metadata.pointId, "string");
  assert.match(
    chunk.metadata.pointId as string,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
  assert.equal(chunk.id, chunk.metadata.pointId, "document.id must match the stamped pointId");
});

test("produces identical checksums and point ids across independent runs on unchanged content (idempotent)", async () => {
  const doc = new Document({ pageContent: "stable content", metadata: { source: "a" } });

  const [first] = await splitDocuments([new Document({ pageContent: doc.pageContent, metadata: { ...doc.metadata } })]);
  const [second] = await splitDocuments([new Document({ pageContent: doc.pageContent, metadata: { ...doc.metadata } })]);

  assert.equal(first.metadata.checksum, second.metadata.checksum);
  assert.equal(first.metadata.pointId, second.metadata.pointId);
  assert.equal(first.id, second.id);
});

test("gives chunks from the same source but different content different checksums, and different point ids across sources", async () => {
  const docA1 = new Document({ pageContent: "version one", metadata: { source: "a" } });
  const docA2 = new Document({ pageContent: "version two, changed", metadata: { source: "a" } });
  const docB = new Document({ pageContent: "version one", metadata: { source: "b" } });

  const [chunkA1] = await splitDocuments([docA1]);
  const [chunkA2] = await splitDocuments([docA2]);
  const [chunkB] = await splitDocuments([docB]);

  // Same source + same chunk index -> same point id regardless of content,
  // so a content edit becomes an upsert against the same point rather than
  // an orphaned new point plus a stale leftover.
  assert.equal(chunkA1.id, chunkA2.id);
  assert.notEqual(chunkA1.metadata.checksum, chunkA2.metadata.checksum);
  // Different source -> different point id even with identical content.
  assert.notEqual(chunkA1.id, chunkB.id);
});

test("assigns distinct sequential point ids to multiple chunks from the same long source document", async () => {
  const longText = Array.from({ length: 10 }, (_, i) => `Sentence number ${i} in the document.`).join(" ");
  const doc = new Document({ pageContent: longText, metadata: { source: "long" } });

  const result = await splitDocuments([doc]);

  const ids = result.map((chunk) => chunk.id);
  assert.equal(new Set(ids).size, ids.length, "every chunk from the same source must get a unique point id");
});
