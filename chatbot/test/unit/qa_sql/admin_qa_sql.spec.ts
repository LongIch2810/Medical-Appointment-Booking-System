import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { UnsafeSqlQueryError } from "../../../src/utils/assertSelectOnlyQuery.js";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";
import { resetState, state } from "./qaSqlTestControl.mjs";

const ADMIN_TABLES = [
  "chatbot_report_users_view",
  "chatbot_report_health_profiles_view",
  "chatbot_report_health_roadmaps_view",
  "chatbot_report_audit_view",
  "chatbot_report_appointments_view",
  "chatbot_report_doctor_schedules_view",
  "chatbot_report_doctors_view",
  "chatbot_report_specialties_view",
];

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/qa_sql")).href + "/";
const controlUrl = pathToFileURL(
  path.resolve(here, "./qaSqlTestControl.mjs"),
).href;

registerEsmMocks(subjectDirUrl, {
  "../configs/llm.js": `
    import { state } from "${controlUrl}";
    export function getChatModel(options) {
      return {
        bindTools: (tools, bindOptions) => {
          state.bindToolsCalls.push({ tools, bindOptions, options });
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
    export const AdminReportDatasource = {
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

const { default: adminQaSqlGraph } = await import(
  "../../../src/qa_sql/admin_qa_sql.js"
);
const initializationCalls = [...state.fromDataSourceParamsCalls];

test("initializes once with only the admin reporting views", () => {
  assert.equal(state.initializeWithRetryCalls.length, 1);
  assert.equal(initializationCalls.length, 1);
  assert.deepEqual(initializationCalls[0].includesTables, ADMIN_TABLES);
});

test("executes an allow-listed SELECT and applies the 1000-row cap", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [
      { args: { query: "SELECT id FROM chatbot_report_users_view" } },
    ],
  };
  state.queryImpl = async () => [{ id: 1 }];

  const result = await adminQaSqlGraph.invoke({ question: "list users" });

  assert.deepEqual(state.queryCalls, [
    "SELECT id FROM chatbot_report_users_view LIMIT 1000",
  ]);
  assert.equal(result.result, JSON.stringify([{ id: 1 }]));
});

test("preserves an existing limit below the admin cap", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [
      {
        args: {
          query: "SELECT * FROM chatbot_report_appointments_view LIMIT 25",
        },
      },
    ],
  };

  await adminQaSqlGraph.invoke({ question: "recent appointments" });
  assert.equal(
    state.queryCalls[0],
    "SELECT * FROM chatbot_report_appointments_view LIMIT 25",
  );
});

for (const [name, query] of [
  ["non-allow-listed table", "SELECT * FROM users"],
  ["sensitive column", "SELECT password FROM chatbot_report_users_view"],
  ["stacked destructive statement", "SELECT 1; DELETE FROM users;"],
  ["limit above the cap", "SELECT * FROM chatbot_report_users_view LIMIT 1001"],
] as const) {
  test(`rejects ${name} before touching the admin datasource`, async () => {
    resetState();
    state.toolInvokeResult = { tool_calls: [{ args: { query } }] };

    await assert.rejects(
      adminQaSqlGraph.invoke({ question: "unsafe request" }),
      (error: unknown) => error instanceof UnsafeSqlQueryError,
    );
    assert.equal(state.queryCalls.length, 0);
  });
}

test("rejects malformed LLM output before touching the admin datasource", async () => {
  resetState();
  state.toolInvokeResult = { tool_calls: [] };

  await assert.rejects(adminQaSqlGraph.invoke({ question: "missing query" }));
  assert.equal(state.queryCalls.length, 0);
});

test("passes the database metadata and question to the SQL model", async () => {
  resetState();
  state.toolInvokeResult = {
    tool_calls: [
      { args: { query: "SELECT * FROM chatbot_report_users_view" } },
    ],
  };

  await adminQaSqlGraph.invoke({ question: "dashboard summary" });

  assert.equal(state.toolInvokeCalls.length, 1);
  assert.match(String(state.toolInvokeCalls[0]), /dashboard summary/);
  assert.match(String(state.toolInvokeCalls[0]), /FAKE_TABLE_INFO/);
});
