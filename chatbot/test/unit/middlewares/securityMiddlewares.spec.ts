import assert from "node:assert/strict";
import test from "node:test";
import { NextFunction, Request, Response } from "express";
import {
  INTERNAL_SERVICE_KEY_HEADER,
  isValidInternalServiceKey,
  requireInternalServiceKey,
} from "../../../src/middlewares/internalServiceAuth.js";
import { createRateLimit } from "../../../src/middlewares/rateLimit.js";
import { InMemoryRateLimitStore } from "../../../src/middlewares/rateLimitStore.js";

function createResponse() {
  const result: {
    status?: number;
    body?: unknown;
    headers: Record<string, number | string>;
  } = { headers: {} };
  const response = {
    status(code: number) {
      result.status = code;
      return response;
    },
    json(body: unknown) {
      result.body = body;
      return response;
    },
    setHeader(name: string, value: number | string) {
      result.headers[name] = value;
      return response;
    },
  } as unknown as Response;
  return { response, result };
}

test("internal service key comparison accepts only the configured key", () => {
  const key = "a-secure-internal-key-with-32-chars";
  assert.equal(isValidInternalServiceKey(key, key), true);
  assert.equal(isValidInternalServiceKey("wrong", key), false);
  assert.equal(isValidInternalServiceKey(undefined, key), false);
});

test("internal auth fails closed when the service key is not configured", () => {
  const previous = process.env.CHATBOT_INTERNAL_KEY;
  delete process.env.CHATBOT_INTERNAL_KEY;
  try {
    const request = { get: () => undefined } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    requireInternalServiceKey(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(result.status, 503);
    assert.equal(nextCalled, false);
  } finally {
    if (previous !== undefined) process.env.CHATBOT_INTERNAL_KEY = previous;
  }
});

test("rate limiter rejects requests beyond the configured window", async () => {
  const limiter = createRateLimit({
    bucket: "test",
    max: 1,
    windowMs: 60_000,
    store: new InMemoryRateLimitStore(),
  });
  const request = {
    ip: "127.0.0.1",
    socket: {},
  } as unknown as Request;
  let nextCalls = 0;

  await limiter(request, createResponse().response, () => {
    nextCalls += 1;
  });
  const second = createResponse();
  await limiter(request, second.response, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(second.result.status, 429);
});

test("two different authenticated users never share a rate-limit quota", async () => {
  const limiter = createRateLimit({
    bucket: "chat",
    max: 1,
    windowMs: 60_000,
    store: new InMemoryRateLimitStore(),
  });
  const requestUser1 = {
    ip: "10.0.0.1",
    socket: {},
    actorUserId: 1,
  } as unknown as Request;
  const requestUser2 = {
    ip: "10.0.0.1", // same IP — both requests arrive via the same backend
    socket: {},
    actorUserId: 2,
  } as unknown as Request;

  const first = createResponse();
  await limiter(requestUser1, first.response, () => undefined);
  const second = createResponse();
  await limiter(requestUser2, second.response, () => undefined);

  // Each user gets their own quota even though they share an IP/backend.
  assert.notEqual(first.result.status, 429);
  assert.notEqual(second.result.status, 429);
});

test("the same authenticated user cannot bypass their quota by appearing to come from a different IP", async () => {
  const limiter = createRateLimit({
    bucket: "chat",
    max: 1,
    windowMs: 60_000,
    store: new InMemoryRateLimitStore(),
  });
  const requestFromIpA = {
    ip: "10.0.0.1",
    socket: {},
    actorUserId: 42,
  } as unknown as Request;
  const requestFromIpB = {
    ip: "10.0.0.2",
    socket: {},
    actorUserId: 42,
  } as unknown as Request;

  const first = createResponse();
  await limiter(requestFromIpA, first.response, () => undefined);
  const second = createResponse();
  await limiter(requestFromIpB, second.response, () => undefined);

  assert.notEqual(first.result.status, 429);
  // Same user, different apparent IP — still the same quota, so blocked.
  assert.equal(second.result.status, 429);
});

test("internal auth rejects a missing key and does not call next", () => {
  const previous = process.env.CHATBOT_INTERNAL_KEY;
  process.env.CHATBOT_INTERNAL_KEY = "a-secure-internal-key-with-32-chars";
  try {
    const request = {
      get: (header: string) =>
        header === INTERNAL_SERVICE_KEY_HEADER ? undefined : undefined,
    } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    requireInternalServiceKey(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(result.status, 401);
    assert.equal(nextCalled, false);
  } finally {
    if (previous === undefined) delete process.env.CHATBOT_INTERNAL_KEY;
    else process.env.CHATBOT_INTERNAL_KEY = previous;
  }
});
