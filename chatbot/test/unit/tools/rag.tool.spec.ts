import assert from "node:assert/strict";
import test from "node:test";
import { ragTool } from "../../../src/tools/rag.tool.js";

// rag.tool.ts itself is thin wiring: its func just awaits setupRagGraph()
// (from ../rag/rag.js) and then ragGraph.invoke(...). Unlike qa_sql.tool.ts,
// setupRagGraph() does all of its real work (Qdrant vector-store connection,
// LangChain Hub prompt pull) *inside* an async function body rather than at
// module-import time, so importing rag.tool.ts here is safe — no network/DB
// calls happen until the tool is actually invoked. Actually invoking it would
// require a live Qdrant instance and network access, so this stays a
// structural smoke test of the tool's registration/schema rather than
// exercising setupRagGraph()/the graph itself.
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
