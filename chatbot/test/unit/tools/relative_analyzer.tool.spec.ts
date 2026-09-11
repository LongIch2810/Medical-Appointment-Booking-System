import assert from "node:assert/strict";
import test from "node:test";
import { resolveRelativeAnalysis } from "../../../src/tools/relative_analyzer.tool.js";

test("defaults to ban_than when there is no explicit relationship and the LLM returned nothing", () => {
  const result = resolveRelativeAnalysis(null, null);
  assert.deepEqual(result, {
    relationship_code: "ban_than",
    name: null,
    dob: null,
    gender: null,
  });
});

test("uses the LLM's relationship_code when no explicit relationship was detected in the text", () => {
  const result = resolveRelativeAnalysis(null, {
    relationship_code: "con_gai",
    name: "Lan",
    dob: "2015-01-01",
    gender: false,
  });
  assert.equal(result.relationship_code, "con_gai");
  assert.equal(result.name, "Lan");
  assert.equal(result.dob, "2015-01-01");
  assert.equal(result.gender, false);
});

test("regression: explicit relationship detected from the text always wins over a conflicting LLM result", () => {
  // e.g. text says "ba tôi" (explicit "cha") but the LLM/gateway mis-parses
  // and returns "ban_than" — the explicit match must NOT be overridden.
  const result = resolveRelativeAnalysis("cha", {
    relationship_code: "ban_than",
    name: null,
    dob: null,
    gender: null,
  });
  assert.equal(result.relationship_code, "cha");
});

test("keeps name/dob/gender extracted by the LLM even when the explicit relationship overrides relationship_code", () => {
  const result = resolveRelativeAnalysis("con_gai", {
    relationship_code: "ban_than",
    name: "Lan",
    dob: "2015-01-01",
    gender: false,
  });
  assert.equal(result.relationship_code, "con_gai");
  assert.equal(result.name, "Lan");
  assert.equal(result.dob, "2015-01-01");
  assert.equal(result.gender, false);
});

test("does not override relationship_code when the explicit and LLM results already agree", () => {
  const result = resolveRelativeAnalysis("me", {
    relationship_code: "me",
    name: null,
    dob: null,
    gender: null,
  });
  assert.equal(result.relationship_code, "me");
});

test("falls back to the explicit relationship (and null fields) when the LLM result has no relationship_code", () => {
  const result = resolveRelativeAnalysis("cha", {
    relationship_code: null,
    name: "should be ignored",
  });
  assert.equal(result.relationship_code, "cha");
  assert.equal(result.name, null);
});

test("falls back to the explicit relationship when the LLM call produced no parsed result at all (e.g. it threw)", () => {
  const result = resolveRelativeAnalysis("ong", undefined);
  assert.equal(result.relationship_code, "ong");
  assert.equal(result.name, null);
  assert.equal(result.dob, null);
  assert.equal(result.gender, null);
});
