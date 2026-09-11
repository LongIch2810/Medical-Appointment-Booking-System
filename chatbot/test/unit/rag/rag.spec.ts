import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type RagStub = {
  searchCalls: unknown[];
  promptCalls: unknown[];
  llmCalls: unknown[];
  searchError?: unknown;
};
const globals = globalThis as typeof globalThis & { __RAG_STUB__: RagStub };

function resetStub() {
  globals.__RAG_STUB__ = { searchCalls: [], promptCalls: [], llmCalls: [] };
}
resetStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/rag")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../configs/vectordb.js": `
    export default async function initVectorDB() {
      return {
        similaritySearch: async (...args) => {
          const state = globalThis.__RAG_STUB__;
          state.searchCalls.push(args);
          if (state.searchError) throw state.searchError;
          return [{ pageContent: "first document" }, { pageContent: "second document" }];
        },
      };
    }
  `,
  "langchain/hub": `
    export async function pull(name) {
      return {
        invoke: async (args) => {
          globalThis.__RAG_STUB__.promptCalls.push({ name, args });
          return { formatted: args };
        },
      };
    }
  `,
  "../configs/llm.js": `
    export function getChatModel() {
      return {
        invoke: async (messages) => {
          globalThis.__RAG_STUB__.llmCalls.push(messages);
          return { content: "grounded answer" };
        },
      };
    }
  `,
});

const { default: setupRagGraph } = await import("../../../src/rag/rag.js");

test.beforeEach(resetStub);

test("retrieves three nearest documents, joins context, and generates an answer", async () => {
  const graph = await setupRagGraph();
  const result = await graph.invoke({ question: "What services are available?" });
  const stub = globals.__RAG_STUB__;

  assert.deepEqual(stub.searchCalls, [["What services are available?", 3]]);
  assert.deepEqual(stub.promptCalls, [
    {
      name: "rlm/rag-prompt",
      args: {
        question: "What services are available?",
        context: "first document\nsecond document",
      },
    },
  ]);
  assert.equal(stub.llmCalls.length, 1);
  assert.equal(result.answer, "grounded answer");
});

test("propagates a non-retryable retrieval failure without calling the prompt or LLM", async () => {
  globals.__RAG_STUB__.searchError = Object.assign(new Error("invalid query"), {
    status: 400,
  });
  const graph = await setupRagGraph();

  await assert.rejects(graph.invoke({ question: "bad query" }), /invalid query/);
  assert.equal(globals.__RAG_STUB__.promptCalls.length, 0);
  assert.equal(globals.__RAG_STUB__.llmCalls.length, 0);
});
