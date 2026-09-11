import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Document } from "@langchain/core/documents";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";
import splitDocumentsReal from "../../../src/utils/splitDocuments.js";

type VectorDbStub = {
  collections: Array<{ name: string | undefined }>;
  collectionSize: number;
  existingPoints: Array<{
    id: string;
    payload: { metadata: Record<string, unknown> };
  }>;
  scrollCalls: unknown[];
  addDocumentsCalls: Array<{ documents: Document[]; options: unknown }>;
  deleteCalls: unknown[];
  fromExistingCalls: unknown[];
  fromDocumentsCalls: unknown[];
};

const globals = globalThis as typeof globalThis & {
  __VECTORDB_STUB__: VectorDbStub;
};

function resetStub() {
  process.env.OPENAI_API_KEY = "test-openai-key";
  process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
  process.env.OPENAI_EMBEDDING_DIMENSIONS = "1536";
  process.env.QDRANT_API_KEY = "test-qdrant-key";
  process.env.QDRANT_URL = "https://qdrant.example.test";
  process.env.QDRANT_COLLECTION_NAME =
    "BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1";
  globals.__VECTORDB_STUB__ = {
    collections: [{ name: process.env.QDRANT_COLLECTION_NAME }],
    collectionSize: 1536,
    existingPoints: [],
    scrollCalls: [],
    addDocumentsCalls: [],
    deleteCalls: [],
    fromExistingCalls: [],
    fromDocumentsCalls: [],
  };
}
resetStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/configs")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "@qdrant/js-client-rest": `
    export class QdrantClient {
      async getCollections() {
        const state = globalThis.__VECTORDB_STUB__;
        return { collections: state.collections };
      }
      async getCollection(name) {
        const state = globalThis.__VECTORDB_STUB__;
        return {
          config: {
            params: { vectors: { size: state.collectionSize, distance: "Cosine" } },
          },
        };
      }
      async scroll(name, params) {
        const state = globalThis.__VECTORDB_STUB__;
        state.scrollCalls.push(params);
        return { points: state.existingPoints, next_page_offset: null };
      }
    }
  `,
  "@langchain/qdrant": `
    export class QdrantVectorStore {
      static async fromDocuments(docs, embeddings, dbConfig) {
        globalThis.__VECTORDB_STUB__.fromDocumentsCalls.push({ docs, dbConfig });
        return new QdrantVectorStore();
      }
      static async fromExistingCollection(embeddings, dbConfig) {
        globalThis.__VECTORDB_STUB__.fromExistingCalls.push(dbConfig);
        return new QdrantVectorStore();
      }
      async addDocuments(documents, options) {
        globalThis.__VECTORDB_STUB__.addDocumentsCalls.push({ documents, options });
      }
      async delete(params) {
        globalThis.__VECTORDB_STUB__.deleteCalls.push(params);
      }
    }
  `,
  "@langchain/openai": `
    export class OpenAIEmbeddings {
      constructor(options) { this.options = options; }
    }
  `,
});

const { default: initVectorDB } = await import(
  "../../../src/configs/vectordb.js"
);

test.beforeEach(resetStub);

function existingPointFrom(doc: Document, checksumOverride?: string) {
  return {
    id: doc.id as string,
    payload: {
      metadata: {
        ...doc.metadata,
        checksum: checksumOverride ?? (doc.metadata.checksum as string),
      },
    },
  };
}

async function buildTwoSourceDocs(): Promise<[Document, Document]> {
  const chunks = await splitDocumentsReal([
    new Document({ pageContent: "Content from document A", metadata: { source: "a.pdf" } }),
    new Document({ pageContent: "Content from document B", metadata: { source: "b.pdf" } }),
  ]);
  assert.equal(chunks.length, 2, "expected one chunk per short source document");
  return [chunks[0], chunks[1]];
}

test("initial build: creates the collection from the incoming documents when it does not exist yet", async () => {
  globals.__VECTORDB_STUB__.collections = [];
  const [docA, docB] = await buildTwoSourceDocs();

  await initVectorDB([docA, docB]);

  const stub = globals.__VECTORDB_STUB__;
  assert.equal(stub.fromDocumentsCalls.length, 1);
  assert.equal(stub.scrollCalls.length, 0);
  assert.equal(stub.addDocumentsCalls.length, 0);
  assert.equal(stub.deleteCalls.length, 0);
});

test("no-op rebuild: an existing collection whose points already match every incoming checksum is left untouched", async () => {
  const [docA, docB] = await buildTwoSourceDocs();
  globals.__VECTORDB_STUB__.existingPoints = [
    existingPointFrom(docA),
    existingPointFrom(docB),
  ];

  await initVectorDB([docA, docB]);

  const stub = globals.__VECTORDB_STUB__;
  assert.equal(stub.scrollCalls.length, 1);
  assert.equal(stub.addDocumentsCalls.length, 0);
  assert.equal(stub.deleteCalls.length, 0);
});

test("doc update: only the changed document's chunk is upserted, matching ids are left alone", async () => {
  const [docA, docB] = await buildTwoSourceDocs();
  globals.__VECTORDB_STUB__.existingPoints = [
    // docA's content changed since the last build: same id, stale checksum.
    existingPointFrom(docA, "stale-checksum-from-previous-build"),
    existingPointFrom(docB),
  ];

  await initVectorDB([docA, docB]);

  const stub = globals.__VECTORDB_STUB__;
  assert.equal(stub.addDocumentsCalls.length, 1);
  const [{ documents, options }] = stub.addDocumentsCalls;
  assert.equal(documents.length, 1);
  assert.equal(documents[0].metadata.source, "a.pdf");
  assert.deepEqual((options as { ids: string[] }).ids, [docA.id]);
  assert.equal(stub.deleteCalls.length, 0);
});

test("doc deletion: a point no longer present among incoming documents is deleted, survivors are untouched", async () => {
  const [docA, docB] = await buildTwoSourceDocs();
  const removedChunks = await splitDocumentsReal([
    new Document({ pageContent: "Content from a removed document", metadata: { source: "removed.pdf" } }),
  ]);
  globals.__VECTORDB_STUB__.existingPoints = [
    existingPointFrom(docA),
    existingPointFrom(docB),
    existingPointFrom(removedChunks[0]),
  ];

  // "removed.pdf" is no longer part of the source corpus this run.
  await initVectorDB([docA, docB]);

  const stub = globals.__VECTORDB_STUB__;
  assert.equal(stub.addDocumentsCalls.length, 0);
  assert.equal(stub.deleteCalls.length, 1);
  assert.deepEqual(stub.deleteCalls[0], { ids: [removedChunks[0].id] });
});

test("production boot with no texts attaches read-only and never reconciles", async () => {
  const [docA] = await buildTwoSourceDocs();
  globals.__VECTORDB_STUB__.existingPoints = [
    existingPointFrom(docA, "some-other-checksum"),
  ];

  await initVectorDB();

  const stub = globals.__VECTORDB_STUB__;
  assert.equal(stub.fromExistingCalls.length, 1);
  assert.equal(stub.scrollCalls.length, 0);
  assert.equal(stub.addDocumentsCalls.length, 0);
  assert.equal(stub.deleteCalls.length, 0);
});

test("rejects a chunk that reaches reconciliation without a stamped pointId/checksum", async () => {
  globals.__VECTORDB_STUB__.existingPoints = [];
  const badDoc = new Document({ pageContent: "no metadata stamped", metadata: {} });

  await assert.rejects(
    initVectorDB([badDoc]),
    /missing metadata\.pointId\/checksum/,
  );
});
