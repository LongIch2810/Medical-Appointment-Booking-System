import assert from "node:assert/strict";
import test from "node:test";
import { ChatbotOperationError } from "../../../src/utils/retry.js";
import errorHandler from "../../../src/middlewares/errorHandler.js";

function createResponse() {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      state.status = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  };
  return { response, state };
}

test("maps Multer size/count limits to 413", () => {
  for (const code of ["LIMIT_FILE_SIZE", "LIMIT_FILE_COUNT"]) {
    const { response, state } = createResponse();
    errorHandler({ code } as never, {} as never, response as never, (() => {}) as never);
    assert.equal(state.status, 413);
    assert.deepEqual(state.body, {
      SC: 413,
      code,
      err: "Upload does not satisfy the file limits.",
    });
  }
});

test("maps other Multer limits to 400", () => {
  const { response, state } = createResponse();
  errorHandler(
    { code: "LIMIT_UNEXPECTED_FILE" } as never,
    {} as never,
    response as never,
    (() => {}) as never,
  );
  assert.equal(state.status, 400);
  assert.deepEqual(state.body, {
    SC: 400,
    code: "LIMIT_UNEXPECTED_FILE",
    err: "Upload does not satisfy the file limits.",
  });
});

test("returns business error details for a normalized 4xx error", () => {
  const { response, state } = createResponse();
  errorHandler(
    new ChatbotOperationError({
      status: 409,
      code: "CONFLICT",
      message: "Appointment already exists",
      retryable: false,
    }),
    {} as never,
    response as never,
    (() => {}) as never,
  );
  assert.deepEqual(state.body, {
    SC: 409,
    code: "CONFLICT",
    err: "Appointment already exists",
  });
});

test("redacts internal error messages for 5xx responses", () => {
  const { response, state } = createResponse();
  errorHandler(
    new Error("database password is secret"),
    {} as never,
    response as never,
    (() => {}) as never,
  );
  assert.equal(state.status, 500);
  assert.deepEqual(state.body, {
    SC: 500,
    code: "INTERNAL_ERROR",
    err: "Chatbot service could not process the request.",
  });
  assert.doesNotMatch(JSON.stringify(state.body), /password is secret/);
});
