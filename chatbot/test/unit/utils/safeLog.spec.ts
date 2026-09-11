import assert from "node:assert/strict";
import test from "node:test";
import { logSafeError } from "../../../src/utils/safeLog.js";

test("logs name, code, and status extracted from an Error-shaped object", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  const err = Object.assign(new Error("boom"), { code: "ECONNRESET", status: 503 });
  logSafeError("my_context", err);

  assert.equal(errorMock.mock.callCount(), 1);
  const [context, payload] = errorMock.mock.calls[0].arguments;
  assert.equal(context, "my_context");
  assert.deepEqual(payload, { name: "Error", code: "ECONNRESET", status: 503 });
});

test("prefers status over response.status when both are present", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  logSafeError("ctx", { status: 404, response: { status: 500 } });

  const [, payload] = errorMock.mock.calls[0].arguments;
  assert.equal(payload.status, 404);
});

test("falls back to response.status when status is absent", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  logSafeError("ctx", { response: { status: 502 } });

  const [, payload] = errorMock.mock.calls[0].arguments;
  assert.equal(payload.status, 502);
});

test("accepts a numeric code as-is", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  logSafeError("ctx", { code: 42 });

  const [, payload] = errorMock.mock.calls[0].arguments;
  assert.equal(payload.code, 42);
});

test("omits fields with the wrong type instead of passing them through", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  logSafeError("ctx", { name: 123, code: true, status: "500" });

  const [, payload] = errorMock.mock.calls[0].arguments;
  assert.deepEqual(payload, {
    name: undefined,
    code: undefined,
    status: undefined,
  });
});

test("handles non-object error values (string, number, null, undefined) without throwing", (t) => {
  const errorMock = t.mock.method(console, "error", () => {});

  for (const value of ["plain string error", 500, null, undefined]) {
    logSafeError("ctx", value);
  }

  assert.equal(errorMock.mock.callCount(), 4);
  for (const call of errorMock.mock.calls) {
    const [, payload] = call.arguments;
    assert.deepEqual(payload, { name: undefined, code: undefined, status: undefined });
  }
});
