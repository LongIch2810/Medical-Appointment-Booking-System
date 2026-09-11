import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type ToolStub = { calls: unknown[]; result?: unknown; error?: unknown };
const globals = globalThis as typeof globalThis & {
  __QA_SQL_TOOL_STUB__: ToolStub;
};
globals.__QA_SQL_TOOL_STUB__ = { calls: [], result: { answer: "answer" } };

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/tools")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../qa_sql/qa_sql.js": `
    export default {
      invoke: async (args) => {
        const state = globalThis.__QA_SQL_TOOL_STUB__;
        state.calls.push(args);
        if (state.error) throw state.error;
        return state.result;
      },
    };
  `,
});

const { qaSqlTool } = await import("../../../src/tools/qa_sql.tool.js");

test.beforeEach(() => {
  globals.__QA_SQL_TOOL_STUB__ = {
    calls: [],
    result: { answer: "database answer" },
  };
});

test("exposes the expected metadata and schema", () => {
  assert.equal(qaSqlTool.name, "qa_sql_tool");
  assert.match(qaSqlTool.description, /PostgreSQL/i);
  assert.equal(qaSqlTool.schema.safeParse({ question: "doctor count" }).success, true);
  assert.equal(qaSqlTool.schema.safeParse({}).success, false);
});

test("returns the graph answer for a successful query", async () => {
  const result = await qaSqlTool.invoke({ question: "doctor count" });

  assert.equal(result, "database answer");
  assert.deepEqual(globals.__QA_SQL_TOOL_STUB__.calls, [
    { question: "doctor count" },
  ]);
});

test("returns a safe fallback when the graph rejects", async (t) => {
  t.mock.method(console, "error", () => undefined);
  globals.__QA_SQL_TOOL_STUB__.error = new Error("database password leaked");

  const result = await qaSqlTool.invoke({ question: "doctor count" });

  assert.match(String(result), /không thể truy vấn/i);
  assert.doesNotMatch(String(result), /password leaked/i);
});
