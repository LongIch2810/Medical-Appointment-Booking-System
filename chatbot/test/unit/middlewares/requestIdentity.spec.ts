import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {
  attachVerifiedActor,
  RequestWithActor,
} from "../../../src/middlewares/requestIdentity.js";

const SECRET = "test-access-token-secret-with-enough-length";

function createResponse() {
  const result: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      result.status = code;
      return response;
    },
    json(body: unknown) {
      result.body = body;
      return response;
    },
  } as unknown as Response;
  return { response, result };
}

function withSecret<T>(fn: () => T): T {
  const previous = process.env.ACCESS_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = SECRET;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.ACCESS_TOKEN_SECRET;
    else process.env.ACCESS_TOKEN_SECRET = previous;
  }
}

test("skips verification and calls next when no token is present (routes with no user context)", () => {
  const request = { body: { question: "hi" } } as unknown as Request;
  const { response, result } = createResponse();
  let nextCalled = false;

  attachVerifiedActor(request, response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(nextCalled, true);
  assert.equal((request as RequestWithActor).actorUserId, undefined);
  assert.equal(result.status, undefined);
});

test("rejects with 503 when ACCESS_TOKEN_SECRET is not configured", () => {
  const previous = process.env.ACCESS_TOKEN_SECRET;
  delete process.env.ACCESS_TOKEN_SECRET;
  try {
    const request = { body: { token: "whatever" } } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    attachVerifiedActor(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(result.status, 503);
    assert.equal(nextCalled, false);
  } finally {
    if (previous !== undefined) process.env.ACCESS_TOKEN_SECRET = previous;
  }
});

test("rejects an invalid/expired token", () => {
  withSecret(() => {
    const request = {
      body: { token: "not-a-real-jwt" },
    } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    attachVerifiedActor(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(result.status, 401);
    assert.equal(
      (result.body as { code: string }).code,
      "CHATBOT_INVALID_ACTOR_TOKEN",
    );
    assert.equal(nextCalled, false);
  });
});

test("rejects when the client-declared userId does not match the token's subject (IDOR)", () => {
  withSecret(() => {
    const token = jwt.sign({ sub: 7, roles: ["PATIENT"] }, SECRET);
    const request = {
      body: { token, userId: 999 },
    } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    attachVerifiedActor(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(result.status, 401);
    assert.equal(
      (result.body as { code: string }).code,
      "CHATBOT_ACTOR_MISMATCH",
    );
    assert.equal(nextCalled, false);
  });
});

test("attaches the verified actorUserId from the token subject and calls next", () => {
  withSecret(() => {
    const token = jwt.sign({ sub: 7, roles: ["PATIENT"] }, SECRET);
    const request = { body: { token, userId: 7 } } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    attachVerifiedActor(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(nextCalled, true);
    assert.equal(result.status, undefined);
    assert.equal((request as RequestWithActor).actorUserId, 7);
  });
});

test("uses a Bearer token before multipart body parsing", () => {
  withSecret(() => {
    const token = jwt.sign({ sub: 11, roles: ["PATIENT"] }, SECRET);
    const request = {
      body: undefined,
      get: (header: string) =>
        header.toLowerCase() === "authorization"
          ? `Bearer ${token}`
          : undefined,
    } as unknown as Request;
    const { response, result } = createResponse();
    let nextCalled = false;

    attachVerifiedActor(request, response, (() => {
      nextCalled = true;
    }) as NextFunction);

    assert.equal(nextCalled, true);
    assert.equal(result.status, undefined);
    assert.equal((request as RequestWithActor).actorUserId, 11);
  });
});
