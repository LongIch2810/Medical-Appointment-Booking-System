import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Document } from "@langchain/core/documents";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";
import { FILE_PATHS } from "../../../src/utils/constants.js";
import splitDocumentsReal from "../../../src/utils/splitDocuments.js";

type KnowledgeBaseStub = {
  loadCalls: string[];
  collections: Array<{ name: string | undefined }>;
  collectionSize: number;
  getCollectionsCalls: number;
  getCollectionCalls: string[];
  getCollectionsError?: unknown;
  existingPoints: Array<{
    id: string;
    payload: { metadata: Record<string, unknown> };
  }>;
  scrollCalls: unknown[][];
  embeddingOptions: Array<Record<string, unknown>>;
  fromDocumentsCalls: unknown[][];
  fromExistingCalls: unknown[][];
  addDocumentsCalls: unknown[][];
  deleteCalls: unknown[][];
};
const globals = globalThis as typeof globalThis & {
  __KNOWLEDGE_BASE_STUB__: KnowledgeBaseStub;
};

function resetStub() {
  process.env.OPENAI_API_KEY = "test-openai-key";
  process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
  process.env.OPENAI_EMBEDDING_DIMENSIONS = "1536";
  process.env.QDRANT_API_KEY = "test-qdrant-key";
  process.env.QDRANT_URL = "https://qdrant.example.test";
  process.env.QDRANT_COLLECTION_NAME =
    "BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1";
  globals.__KNOWLEDGE_BASE_STUB__ = {
    loadCalls: [],
    collections: [],
    collectionSize: 1536,
    getCollectionsCalls: 0,
    getCollectionCalls: [],
    existingPoints: [],
    scrollCalls: [],
    embeddingOptions: [],
    fromDocumentsCalls: [],
    fromExistingCalls: [],
    addDocumentsCalls: [],
    deleteCalls: [],
  };
}
resetStub();

const LONG_CONTENT = Array.from(
  { length: 10 },
  (_, index) => `Document paragraph ${index} with enough text for splitting.`,
).join(" ");

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/utils")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "@langchain/community/document_loaders/fs/pdf": `
    export class PDFLoader {
      constructor(filePath) { this.filePath = filePath; }
      async load() {
        const state = globalThis.__KNOWLEDGE_BASE_STUB__;
        state.loadCalls.push(this.filePath);
        return [{ pageContent: ${JSON.stringify(LONG_CONTENT)}, metadata: { source: this.filePath } }];
      }
    }
  `,
  "@qdrant/js-client-rest": `
    export class QdrantClient {
      async getCollections() {
        const state = globalThis.__KNOWLEDGE_BASE_STUB__;
        state.getCollectionsCalls += 1;
        if (state.getCollectionsError) throw state.getCollectionsError;
        return { collections: state.collections };
      }
      async getCollection(name) {
        const state = globalThis.__KNOWLEDGE_BASE_STUB__;
        state.getCollectionCalls.push(name);
        return {
          config: {
            params: { vectors: { size: state.collectionSize, distance: "Cosine" } },
          },
        };
      }
      async scroll(...args) {
        const state = globalThis.__KNOWLEDGE_BASE_STUB__;
        state.scrollCalls.push(args);
        return { points: state.existingPoints, next_page_offset: null };
      }
    }
  `,
  "@langchain/qdrant": `
    export class QdrantVectorStore {
      static async fromDocuments(...args) {
        globalThis.__KNOWLEDGE_BASE_STUB__.fromDocumentsCalls.push(args);
        return new QdrantVectorStore();
      }
      static async fromExistingCollection(...args) {
        globalThis.__KNOWLEDGE_BASE_STUB__.fromExistingCalls.push(args);
        return new QdrantVectorStore();
      }
      async addDocuments(...args) {
        globalThis.__KNOWLEDGE_BASE_STUB__.addDocumentsCalls.push(args);
      }
      async delete(...args) {
        globalThis.__KNOWLEDGE_BASE_STUB__.deleteCalls.push(args);
      }
    }
  `,
  "@langchain/openai": `
    export class OpenAIEmbeddings {
      constructor(options) {
        this.options = options;
        globalThis.__KNOWLEDGE_BASE_STUB__.embeddingOptions.push(options);
      }
    }
  `,
});

const { buildKnowLedgeBase } = await import(
  "../../../src/utils/buildKnowLedgeBase.js"
);

test.beforeEach(resetStub);

test("builds embeddings from loaded and split documents for a new collection", async () => {
  const result = await buildKnowLedgeBase();
  const stub = globals.__KNOWLEDGE_BASE_STUB__;

  assert.equal(result, undefined);
  assert.equal(stub.loadCalls.length, 2);
  assert.equal(stub.fromExistingCalls.length, 0);
  assert.equal(stub.fromDocumentsCalls.length, 1);
  assert.deepEqual(stub.embeddingOptions, [
    {
      apiKey: "test-openai-key",
      model: "text-embedding-3-small",
      dimensions: 1536,
      batchSize: 100,
      timeout: 30000,
      maxRetries: 2,
    },
  ]);
  assert.deepEqual(stub.getCollectionCalls, [
    "BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1",
  ]);
  const texts = stub.fromDocumentsCalls[0][0] as Array<{
    pageContent: string;
    metadata: { source: string };
  }>;
  assert.ok(texts.length > 2);
  assert.ok(texts.every((document) => document.pageContent.length <= 100));
  assert.equal(new Set(texts.map((document) => document.metadata.source)).size, 2);
});

test("leaves an existing collection untouched when loaded chunks already match", async () => {
  const stub = globals.__KNOWLEDGE_BASE_STUB__;
  const existingChunks = await splitDocumentsReal(
    FILE_PATHS.map(
      (source) =>
        new Document({
          pageContent: LONG_CONTENT,
          metadata: { source },
        }),
    ),
  );

  stub.collections = [
    { name: process.env.QDRANT_COLLECTION_NAME },
  ];
  stub.existingPoints = existingChunks.map((chunk) => ({
    id: chunk.id as string,
    payload: { metadata: chunk.metadata },
  }));

  await buildKnowLedgeBase();

  assert.equal(stub.fromExistingCalls.length, 1);
  assert.equal(stub.fromDocumentsCalls.length, 0);
  assert.equal(stub.scrollCalls.length, 1);
  assert.equal(stub.addDocumentsCalls.length, 0);
  assert.equal(stub.deleteCalls.length, 0);
});

test("rejects an existing collection with incompatible vector dimensions", async () => {
  globals.__KNOWLEDGE_BASE_STUB__.collections = [
    { name: process.env.QDRANT_COLLECTION_NAME },
  ];
  globals.__KNOWLEDGE_BASE_STUB__.collectionSize = 768;

  await assert.rejects(
    buildKnowLedgeBase(),
    /has vector size 768; expected 1536/,
  );

  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.fromExistingCalls.length, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.fromDocumentsCalls.length, 0);
});

test("fails before contacting Qdrant when the shared OpenAI API key is missing", async () => {
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    buildKnowLedgeBase(),
    /OPENAI_API_KEY must be configured/,
  );

  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.getCollectionsCalls, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.embeddingOptions.length, 0);
});

test("rejects incompatible OpenAI embedding dimensions before external calls", async () => {
  process.env.OPENAI_EMBEDDING_DIMENSIONS = "512";

  await assert.rejects(
    buildKnowLedgeBase(),
    /OPENAI_EMBEDDING_DIMENSIONS must be 1536/,
  );

  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.getCollectionsCalls, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.embeddingOptions.length, 0);
});

test("rejects an unsupported OpenAI embedding model before external calls", async () => {
  process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-large";

  await assert.rejects(
    buildKnowLedgeBase(),
    /OPENAI_EMBEDDING_MODEL must be text-embedding-3-small/,
  );

  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.getCollectionsCalls, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.embeddingOptions.length, 0);
});

test("refuses to write OpenAI vectors into the legacy Ollama collection", async () => {
  process.env.QDRANT_COLLECTION_NAME = "BOOKING_DOCTOR_SYSTEM_COLLECTION";

  await assert.rejects(
    buildKnowLedgeBase(),
    /must be BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1/,
  );

  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.getCollectionsCalls, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.fromDocumentsCalls.length, 0);
});

test("propagates a Qdrant failure without performing a real network request", async () => {
  globals.__KNOWLEDGE_BASE_STUB__.getCollectionsError = Object.assign(
    new Error("qdrant rejected request"),
    { status: 400 },
  );

  await assert.rejects(buildKnowLedgeBase(), /qdrant rejected request/);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.fromDocumentsCalls.length, 0);
  assert.equal(globals.__KNOWLEDGE_BASE_STUB__.fromExistingCalls.length, 0);
});
