import assert from "node:assert/strict";
import test from "node:test";
import {
  ChatbotOperationError,
  createRetryingFetch,
  getErrorStatus,
  isConnectionError,
  isRetryableChatbotError,
  normalizeChatbotError,
  withRetry,
} from "../../../src/utils/retry.js";

test("only retries the approved HTTP statuses", () => {
  for (const status of [408, 429, 500, 502, 503, 504]) {
    assert.equal(isRetryableChatbotError({ status }), true);
  }

  for (const status of [400, 401, 403, 404, 409, 422, 501]) {
    assert.equal(isRetryableChatbotError({ status }), false);
  }
});

test("does not retry conflicts", async () => {
  let attempts = 0;
  let sleeps = 0;

  await assert.rejects(
    withRetry(
      async () => {
        attempts += 1;
        throw { status: 409, message: "slot is unavailable" };
      },
      {
        operation: "booking",
        sleep: async () => {
          sleeps += 1;
        },
      },
    ),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "CONFLICT",
  );

  assert.equal(attempts, 1);
  assert.equal(sleeps, 0);
});

test("retries a connection error at most twice", async () => {
  let attempts = 0;
  const delays: number[] = [];

  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw { code: "ECONNRESET", message: "socket reset" };
      return "ok";
    },
    {
      operation: "read_operation",
      random: () => 1,
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
    },
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test("normalizes schema and backend business errors", () => {
  const schemaError = normalizeChatbotError({
    name: "ZodError",
    message: "invalid schema",
  });
  assert.equal(schemaError.code, "SCHEMA_VALIDATION_FAILED");
  assert.equal(schemaError.status, 422);
  assert.equal(
    normalizeChatbotError({
      status: 409,
      response: { data: { error: { code: "APPOINTMENT_SLOT_UNAVAILABLE" } } },
    }).code,
    "APPOINTMENT_SLOT_UNAVAILABLE",
  );
  const businessError = normalizeChatbotError({
    code: "BUSINESS_RULE_VIOLATION",
    message: "rule failed",
  });
  assert.equal(businessError.status, 409);
  assert.equal(businessError.code, "BUSINESS_RULE_VIOLATION");
});

test("does not retry a 409 response from the LLM transport", async () => {
  let calls = 0;
  const retryingFetch = createRetryingFetch(async () => {
    calls += 1;
    return new Response("conflict", { status: 409 });
  });

  const response = await retryingFetch("https://llm.example.test");

  assert.equal(response.status, 409);
  assert.equal(calls, 1);
});

test("getErrorStatus reads status, statusCode, or response.status, in that order of preference", () => {
  assert.equal(getErrorStatus({ status: 404 }), 404);
  assert.equal(getErrorStatus({ statusCode: 500 }), 500);
  assert.equal(getErrorStatus({ response: { status: 503 } }), 503);
  assert.equal(
    getErrorStatus({ status: 404, statusCode: 500, response: { status: 503 } }),
    404,
  );
  assert.equal(getErrorStatus(undefined), undefined);
  assert.equal(getErrorStatus("not an object"), undefined);
});

test("isConnectionError recognizes known connection error codes, abort/timeout names, and message text", () => {
  for (const code of ["ECONNABORTED", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EPIPE", "ETIMEDOUT"]) {
    assert.equal(isConnectionError({ code }), true, `expected code ${code} to be a connection error`);
  }
  assert.equal(isConnectionError({ name: "AbortError" }), true);
  assert.equal(isConnectionError({ name: "TimeoutError" }), true);
  assert.equal(
    isConnectionError({ message: "connection reset unexpectedly" }),
    true,
  );
  assert.equal(isConnectionError(new Error("plain application error")), false);
  assert.equal(isConnectionError({ code: "UNRELATED" }), false);
});

test("isConnectionError recurses into error.cause", () => {
  const wrapped = { message: "wrapper", cause: { code: "ECONNRESET" } };
  assert.equal(isConnectionError(wrapped), true);
});

test("ChatbotOperationError is returned as-is by normalizeChatbotError (idempotent)", () => {
  const original = new ChatbotOperationError({
    status: 404,
    code: "NOT_FOUND",
    message: "not found",
    retryable: false,
  });

  const normalized = normalizeChatbotError(original);

  assert.equal(normalized, original);
});

test("normalizeChatbotError falls back to a Vietnamese default message when none is present", () => {
  const retryableError = normalizeChatbotError({ status: 503 });
  assert.match(retryableError.message, /thử lại sau/i);

  const nonRetryableError = normalizeChatbotError({ status: 400 });
  assert.match(nonRetryableError.message, /Đã xảy ra lỗi/i);
});

test("withRetry does not sleep into (or past) the total deadline — fails fast instead of retrying forever", async () => {
  let attempts = 0;
  let now = 0;
  const delays: number[] = [];

  await assert.rejects(
    withRetry(
      async () => {
        attempts += 1;
        throw { code: "ETIMEDOUT", message: "connection timed out" };
      },
      {
        operation: "read_operation",
        maxAttempts: 5,
        random: () => 1,
        now: () => now,
        sleep: async (delayMs) => {
          delays.push(delayMs);
          now += delayMs; // simulate real elapsed time without a real timer
        },
        // 500ms first backoff would fit; the 1000ms second backoff would
        // push past a 700ms total budget, so the loop must stop there
        // instead of sleeping into (or past) the deadline.
        totalTimeoutMs: 700,
      },
    ),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "UPSTREAM_CONNECTION_ERROR",
  );

  // One initial attempt, one retry after the first (affordable) backoff,
  // then stop — the second backoff would exceed the 700ms budget.
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [500]);
});

test("withRetry with no totalTimeoutMs retries up to maxAttempts as before (no behavior change for existing callers)", async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 3) throw { code: "ECONNRESET" };
      return "ok";
    },
    { operation: "op", random: () => 1, sleep: async () => undefined },
  );
  assert.equal(result, "ok");
  assert.equal(attempts, 3);
});

// Uses a short REAL timeout rather than node:test's mock.timers: in this
// project's ts-node/esm test setup, `t.mock.timers` crashes the process with
// an uncaught exception even for the most minimal usage (reproduced outside
// this file's own logic) — an environment/loader incompatibility, not
// something fixable from the test code. withRetry's own deadline logic is
// still verified with a fully fake (injected) clock in the test above.
test("createRetryingFetch aborts a hung attempt via its own per-attempt AbortController, and the shared deadline stops any further retry", async () => {
  let calls = 0;
  const hungFetch: typeof fetch = (_input, init) => {
    calls += 1;
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("aborted") as Error & { name: string };
        err.name = "AbortError";
        reject(err);
      });
    });
  };

  const retryingFetch = createRetryingFetch(hungFetch, {
    perAttemptTimeoutMs: 30,
    // Deadline equals the per-attempt timeout, so there's no budget left
    // for a retry's backoff once the first attempt times out.
    totalTimeoutMs: 30,
  });

  await assert.rejects(retryingFetch("https://llm.example.test"));

  assert.equal(calls, 1);
});

test("createRetryingFetch forwards a caller-supplied AbortSignal to every retry attempt (state persists, not reset per attempt)", async () => {
  const externalController = new AbortController();
  const seenAbortedStates: boolean[] = [];
  let calls = 0;
  const flaky: typeof fetch = async (_input, init) => {
    calls += 1;
    seenAbortedStates.push(init?.signal?.aborted ?? false);
    if (calls === 1) {
      // Caller cancels right after the first attempt observes the signal.
      externalController.abort();
      const error = new Error("upstream error") as Error & { status?: number };
      error.status = 500;
      throw error;
    }
    throw new Error("unexpected further attempt");
  };

  const retryingFetch = createRetryingFetch(flaky);
  await assert.rejects(
    retryingFetch("https://llm.example.test", {
      signal: externalController.signal,
    }),
  );

  assert.equal(calls, 2);
  assert.equal(seenAbortedStates[0], false);
  // The retry sees the SAME already-aborted signal — proof the caller's
  // cancellation isn't reset/ignored on the next attempt.
  assert.equal(seenAbortedStates[1], true);
});
