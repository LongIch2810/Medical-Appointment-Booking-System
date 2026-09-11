// Helper for spec files: registers the esmMock.hook.mjs loader hook with a
// concrete specifier -> ESM source-code map, so that a subsequent dynamic
// import() of the real subject module resolves those specific dependency
// specifiers to the given stub source instead of the real module. See
// esmMock.hook.mjs for why this exists instead of node:test's mock.module.
import { register } from "node:module";

/**
 * @param {string} baseDirFileUrl file:// URL of the directory the subject
 *   module lives in (so relative-import specifiers used *inside* the mock
 *   source, and bare-package node_modules resolution from within it, behave
 *   the same as they would from the real file).
 * @param {Record<string, string>} mocks specifier (exactly as written in the
 *   subject module's own import statements) -> replacement ESM source text.
 */
export function registerEsmMocks(baseDirFileUrl, mocks) {
  register(new URL("./esmMock.hook.mjs", import.meta.url), {
    data: { baseURL: baseDirFileUrl, mocks },
  });
}
