// Plain (unmocked) shared mutable state used by qa_sql.spec.ts's injected
// mock sources AND by the spec file itself, so tests can configure fake
// LLM/DB responses and assert on what qa_sql.ts actually called. Imported by
// both sides via the same absolute file:// URL, so it's the same module
// instance (Node's ESM module cache is keyed by resolved URL).
export const state = {
  promptInvokeResult: undefined,
  llmInvokeResult: { content: "default answer" },
  llmInvokeCalls: [],
  toolInvokeResult: { tool_calls: [{ args: { query: "SELECT 1 FROM doctors_view" } }] },
  toolInvokeCalls: [],
  bindToolsCalls: [],
  tableInfo: "FAKE_TABLE_INFO",
  fromDataSourceParamsCalls: [],
  queryImpl: async () => [{ ok: true }],
  queryCalls: [],
  initializeWithRetryCalls: [],
};

export function resetState() {
  state.promptInvokeResult = undefined;
  state.llmInvokeResult = { content: "default answer" };
  state.llmInvokeCalls.length = 0;
  state.toolInvokeResult = {
    tool_calls: [{ args: { query: "SELECT 1 FROM doctors_view" } }],
  };
  state.toolInvokeCalls.length = 0;
  state.bindToolsCalls.length = 0;
  state.tableInfo = "FAKE_TABLE_INFO";
  state.fromDataSourceParamsCalls.length = 0;
  state.queryImpl = async () => [{ ok: true }];
  state.queryCalls.length = 0;
  state.initializeWithRetryCalls.length = 0;
}
