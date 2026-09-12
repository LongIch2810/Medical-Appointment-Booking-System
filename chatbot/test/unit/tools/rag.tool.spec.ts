import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

// rag.ts now initializes its Qdrant vector store + LLM ONCE at module-import
// time (eager init, fixed a per-request latency bug — see rag.ts's own
// comment). That means importing rag.tool.ts here would trigger real
// network/DB calls unless we mock rag.ts's own dependencies first, the same
// way rag.spec.ts does. We mock relative to src/rag/ (where rag.ts's own
// import specifiers resolve), not src/tools/, since that's the module doing
// the actual initialization work.
const here = path.dirname(fileURLToPath(import.meta.url));
const ragDirUrl = pathToFileURL(path.resolve(here, "../../../src/rag")).href + "/";

registerEsmMocks(ragDirUrl, {
  "../configs/vectordb.js": `
    export default async function initVectorDB() {
      return { similaritySearch: async () => [] };
    }
  `,
  "../configs/llm.js": `
    export function getChatModel() {
      return { invoke: async () => ({ content: "" }) };
    }
  `,
});

const { ragTool } = await import("../../../src/tools/rag.tool.js");

test("rag_tool is registered with the expected name and a non-empty description", () => {
  assert.equal(ragTool.name, "rag_tool");
  assert.equal(typeof ragTool.description, "string");
  assert.ok(ragTool.description.length > 0);
});

test("rag_tool's input schema requires a string `question`", () => {
  assert.equal(
    ragTool.schema.safeParse({ question: "Giờ làm việc của phòng khám?" })
      .success,
    true,
  );
  assert.equal(ragTool.schema.safeParse({}).success, false);
  assert.equal(ragTool.schema.safeParse({ question: 123 }).success, false);
});
