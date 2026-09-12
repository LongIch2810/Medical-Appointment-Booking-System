import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type RagStub = {
  searchCalls: unknown[];
  llmCalls: unknown[];
  searchError?: unknown;
};
const globals = globalThis as typeof globalThis & { __RAG_STUB__: RagStub };

function resetStub() {
  globals.__RAG_STUB__ = { searchCalls: [], llmCalls: [] };
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

const { default: ragGraph } = await import("../../../src/rag/rag.js");

test.beforeEach(resetStub);

test("retrieves three nearest documents, joins context, and generates an answer", async () => {
  const result = await ragGraph.invoke({ question: "What services are available?" });
  const stub = globals.__RAG_STUB__;

  assert.deepEqual(stub.searchCalls, [["What services are available?", 3]]);
  assert.equal(stub.llmCalls.length, 1);

  // prompt.invoke() giờ dùng ChatPromptTemplate thật (không còn pull từ
  // LangChain Hub) — kiểm tra nội dung câu hỏi + tài liệu truy xuất được đã
  // thật sự lọt vào message gửi cho LLM, thay vì assert trên promptCalls.
  const [renderedMessages] = stub.llmCalls as [
    Array<{ content: string }> & { toChatMessages?: () => Array<{ content: string }> },
  ];
  const messages =
    typeof (renderedMessages as any).toChatMessages === "function"
      ? (renderedMessages as any).toChatMessages()
      : renderedMessages;
  const renderedText = JSON.stringify(messages);
  assert.match(renderedText, /What services are available\?/);
  assert.match(renderedText, /first document/);
  assert.match(renderedText, /second document/);

  assert.equal(result.answer, "grounded answer");
});

test("propagates a non-retryable retrieval failure without calling the prompt or LLM", async () => {
  globals.__RAG_STUB__.searchError = Object.assign(new Error("invalid query"), {
    status: 400,
  });

  await assert.rejects(ragGraph.invoke({ question: "bad query" }), /invalid query/);
  assert.equal(globals.__RAG_STUB__.llmCalls.length, 0);
});
