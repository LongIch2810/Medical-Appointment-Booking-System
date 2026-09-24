import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type ToolStub = { calls: unknown[]; result?: unknown; error?: unknown };
const globals = globalThis as typeof globalThis & {
  __ADMIN_QA_SQL_TOOL_STUB__: ToolStub;
};
globals.__ADMIN_QA_SQL_TOOL_STUB__ = {
  calls: [],
  result: { result: "[]" },
};

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/tools")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../qa_sql/admin_qa_sql.js": `
    export default {
      invoke: async (args) => {
        const state = globalThis.__ADMIN_QA_SQL_TOOL_STUB__;
        state.calls.push(args);
        if (state.error) throw state.error;
        return state.result;
      },
    };
  `,
});

const { AdminQaSqlTool } = await import(
  "../../../src/tools/admin_qa_sql.tool.js"
);

test.beforeEach(() => {
  globals.__ADMIN_QA_SQL_TOOL_STUB__ = {
    calls: [],
    result: {
      query: "SELECT COUNT(*) AS count FROM chatbot_report_users_view LIMIT 1000",
      result: '[{"count":2}]',
    },
  };
});

test("exposes the expected metadata and schema", () => {
  assert.equal(AdminQaSqlTool.name, "admin_qa_sql_tool");
  assert.match(AdminQaSqlTool.description, /SQL/);
  assert.equal(
    AdminQaSqlTool.schema.safeParse({ question: "monthly report" }).success,
    true,
  );
  assert.equal(AdminQaSqlTool.schema.safeParse({}).success, false);
});

test("returns the graph result for a successful admin query", async () => {
  const result = await AdminQaSqlTool.invoke({ question: "monthly report" });

  assert.equal(
    result,
    '{"query":"SELECT COUNT(*) AS count FROM chatbot_report_users_view LIMIT 1000","rows":[{"count":2}]}',
  );
  assert.deepEqual(globals.__ADMIN_QA_SQL_TOOL_STUB__.calls, [
    { question: "monthly report" },
  ]);
});

test("returns a safe fallback when the admin graph rejects", async (t) => {
  t.mock.method(console, "error", () => undefined);
  globals.__ADMIN_QA_SQL_TOOL_STUB__.error = new Error("sensitive DB failure");

  const result = await AdminQaSqlTool.invoke({ question: "monthly report" });

  assert.match(String(result), /Lỗi hệ thống/i);
  assert.doesNotMatch(String(result), /sensitive DB failure/i);
});
