export interface SqlTestState {
  promptInvokeResult: unknown;
  llmInvokeResult: { content: unknown };
  llmInvokeCalls: unknown[];
  toolInvokeResult: { tool_calls: Array<{ args: { query: string } }> };
  toolInvokeCalls: unknown[];
  bindToolsCalls: unknown[];
  tableInfo: string;
  fromDataSourceParamsCalls: Array<Record<string, unknown>>;
  queryImpl: (sql: string) => Promise<unknown[]>;
  queryCalls: string[];
  initializeWithRetryCalls: unknown[];
}

export const state: SqlTestState;
export function resetState(): void;
