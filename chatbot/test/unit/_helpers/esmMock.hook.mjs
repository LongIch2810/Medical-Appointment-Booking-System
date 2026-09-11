// Node.js module customization hook (see https://nodejs.org/api/module.html#customization-hooks)
// used to stub out specific import specifiers (DB connections, LLM clients,
// remote LangChain hub pulls, ...) for the qa_sql/admin_qa_sql/agents/rag
// unit tests, WITHOUT requiring the --experimental-test-module-mocks CLI
// flag (node:test's built-in mock.module needs that flag; this repo's test
// script — and the task's verification command — does not set it).
//
// Registered at runtime via `module.register()` from inside a spec file,
// before the real subject module is dynamically imported. Only specifiers
// present in the `mocks` map (passed in via `initialize`'s data) are
// intercepted; everything else falls through to the next hook in the chain
// (ts-node/esm, then Node's default resolver/loader) completely unchanged.

let baseURL;
let mocks = new Map();

export function initialize(data) {
  baseURL = data.baseURL;
  mocks = new Map(Object.entries(data.mocks));
}

function mockUrlFor(specifier) {
  // Keep the synthetic module URL file-shaped so relative imports still resolve
  // from baseURL, but do not leave encoded path separators in it. Node's native
  // coverage reporter calls fileURLToPath() for every loaded file URL and rejects
  // `%2F`/`%5C`, even when that URL represents an in-memory module.
  const safeSpecifier = encodeURIComponent(specifier)
    .replace(/%2F/gi, "~2F")
    .replace(/%5C/gi, "~5C");
  return new URL(
    `./__esmmock__/${safeSpecifier}.mjs`,
    baseURL,
  ).href;
}

export async function resolve(specifier, context, nextResolve) {
  if (mocks.has(specifier)) {
    return { url: mockUrlFor(specifier), shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const marker = "/__esmmock__/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const encoded = url.slice(idx + marker.length).replace(/\.mjs$/, "");
    const specifier = decodeURIComponent(
      encoded.replace(/~2F/gi, "%2F").replace(/~5C/gi, "%5C"),
    );
    if (mocks.has(specifier)) {
      return {
        format: "module",
        source: mocks.get(specifier),
        shortCircuit: true,
      };
    }
  }
  return nextLoad(url, context);
}
