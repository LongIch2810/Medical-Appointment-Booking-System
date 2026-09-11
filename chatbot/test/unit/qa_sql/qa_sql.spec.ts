import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";
import { state, resetState } from "./qaSqlTestControl.mjs";
import { UnsafeSqlQueryError } from "../../../src/utils/assertSelectOnlyQuery.js";

// qa_sql.ts (the subject) runs real DB connection + LangChain hub network
// calls at module *import* time (top-level await), and its internal
// writeQuery/executeQuery/generateAnswer node functions aren't exported —
// the only export is the compiled graph. node:test's built-in mock.module()
// needs --experimental-test-module-mocks, which isn't set by this repo's
// test script or by the task's verification command, so we can't use it
// here. Instead we register a small custom module hook (see
// ../_helpers/esmMock.hook.mjs) BEFORE importing the real qa_sql.ts, which
// swaps out only its DB/LLM/hub dependencies for controllable fakes and
// leaves everything else (assertSelectOnlyQuery, withRetry, StateGraph...)
// real. This lets us exercise the real writeQuery -> executeQuery ->
// generateAnswer graph, including the real select-only guardrail, without
// ever touching a real database or network.

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/qa_sql")).href + "/";
const controlUrl = pathToFileURL(
  path.resolve(here, "./qaSqlTestControl.mjs"),
).href;

registerEsmMocks(subjectDirUrl, {
  "langchain/hub": `
    import { state } from "${controlUrl}";
    export async function pull(name) {
      return {
        invoke: async (vars) =>
          state.promptInvokeResult !== undefined ? state.promptInvokeResult : vars,
      };
    }
  `,
  "../configs/llm.js": `
    import { state } from "${controlUrl}";
    export function getChatModel(opts) {
      return {
        invoke: async (promptValue) => {
          state.llmInvokeCalls.push(promptValue);
          return state.llmInvokeResult;
        },
        bindTools: (tools, bindOpts) => {
          state.bindToolsCalls.push({ tools, bindOpts });
          return {
            invoke: async (promptValue) => {
              state.toolInvokeCalls.push(promptValue);
              return state.toolInvokeResult;
            },
          };
        },
      };
    }
  `,
  "langchain/sql_db": `
    import { state } from "${controlUrl}";
    export class SqlDatabase {
      static async fromDataSourceParams(params) {
        state.fromDataSourceParamsCalls.push(params);
        return {
          appDataSourceOptions: { type: "postgres" },
          getTableInfo: async () => state.tableInfo,
        };
      }
    }
  `,
  "../database/data-source.js": `
    import { state } from "${controlUrl}";
    export const AppDatasource = {
      query: async (sql) => {
        state.queryCalls.push(sql);
        return state.queryImpl(sql);
      },
    };
    export async function initializeWithRetry(dataSource) {
      state.initializeWithRetryCalls.push(dataSource);
      return dataSource;
    }
  `,
});

const { default: qaSqlGraph } = await import("../../../src/qa_sql/qa_sql.js");
const initializationCalls = [...state.fromDataSourceParamsCalls];

test("initializes the SQL database once with only public reporting views", () => {
  assert.equal(state.initializeWithRetryCalls.length, 1);
  assert.equal(initializationCalls.length, 1);
  assert.deepEqual(initializationCalls[0].includesTables, [
    "doctors_view",
    "articles_view",
    "specialties_view",
  ]);
});

test("happy path: runs a well-formed, allow-listed query end to end", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT name FROM doctors_view" } }],
  };
  state.queryImpl = async () => [{ name: "Dr. A" }];
  state.llmInvokeResult = { content: "There is one doctor named Dr. A." };

  const finalState = await qaSqlGraph.invoke({
    question: "How many doctors are there?",
  });

  assert.equal(state.queryCalls.length, 1);
  assert.equal(state.queryCalls[0], "SELECT name FROM doctors_view LIMIT 200");
  assert.equal(finalState.answer, "There is one doctor named Dr. A.");
  assert.equal(finalState.result, JSON.stringify([{ name: "Dr. A" }]));
});

test("guardrail: a query against a non-allow-listed table is rejected before hitting the database", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT * FROM users" } }],
  };

  await assert.rejects(
    qaSqlGraph.invoke({ question: "list all users" }),
    (error: unknown) => error instanceof UnsafeSqlQueryError,
  );

  // The critical assertion: the guardrail must run BEFORE the query ever
  // reaches AppDatasource.query — a rejected query must never be executed.
  assert.equal(
    state.queryCalls.length,
    0,
    "AppDatasource.query must not be called when assertSelectOnlyQuery rejects the query",
  );
});

test("guardrail: a destructive statement disguised as a query is rejected and never executed", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT 1; DROP TABLE doctors_view;" } }],
  };

  await assert.rejects(qaSqlGraph.invoke({ question: "drop everything" }));
  assert.equal(state.queryCalls.length, 0);
});

test("guardrail: a query touching a sensitive column is rejected even though it targets an allow-listed-looking table", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT password FROM doctors_view" } }],
  };

  await assert.rejects(qaSqlGraph.invoke({ question: "get passwords" }));
  assert.equal(state.queryCalls.length, 0);
});

test("a query with no rows over the 200-row cap is passed through unmodified (LIMIT already present and under the cap)", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT * FROM doctors_view LIMIT 50" } }],
  };
  state.queryImpl = async () => [];

  await qaSqlGraph.invoke({ question: "list a few doctors" });

  assert.equal(state.queryCalls[0], "SELECT * FROM doctors_view LIMIT 50");
});

test("a query with no LIMIT clause gets the 200-row cap appended by the guardrail before being executed", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT * FROM doctors_view" } }],
  };

  await qaSqlGraph.invoke({ question: "list all doctors" });

  assert.equal(state.queryCalls[0], "SELECT * FROM doctors_view LIMIT 200");
});

test("malformed LLM output (missing tool call, so state.query is undefined) is rejected by the guardrail rather than silently querying", async () => {
  resetState();
  state.toolInvokeResult = { tool_calls: [] };

  await assert.rejects(qaSqlGraph.invoke({ question: "??" }));
  assert.equal(state.queryCalls.length, 0);
});

test("writeQuery feeds table metadata and the question into the LLM prompt", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT * FROM doctors_view" } }],
  };

  await qaSqlGraph.invoke({ question: "anything" });

  assert.equal(state.toolInvokeCalls.length, 1);
  assert.deepEqual(state.toolInvokeCalls[0], {
    dialect: "postgres",
    top_k: 10,
    table_info: "FAKE_TABLE_INFO",
    input: "anything",
  });
});
