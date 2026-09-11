import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { BenhAnSchema, ocrTool } from "../../../src/tools/ocr.tool.js";

// BenhAnSchema is a large, fully-required nested object (every leaf is a
// required z.string(), per the "empty field => \"\"" contract documented in
// ocr.tool.ts's own system prompt) — rather than hand-typing every one of its
// ~60 leaf fields, walk the schema itself to build a minimally-valid fixture
// (every string leaf "", every array leaf []). This exercises the *real*
// exported schema (so it breaks if the schema shape changes) without
// duplicating its structure by hand.
function buildValidFixture(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      result[key] = buildValidFixture(shape[key]);
    }
    return result;
  }
  if (schema instanceof z.ZodArray) {
    return [];
  }
  return "";
}

test("ocr_tool is registered with the expected name, a non-empty description, and an array-of-image input schema", () => {
  assert.equal(ocrTool.name, "ocr_tool");
  assert.equal(typeof ocrTool.description, "string");
  assert.ok(ocrTool.description.length > 0);

  const validInput = [{ mimetype: "image/png", base64: "abc123" }];
  assert.equal(ocrTool.schema.safeParse(validInput).success, true);
});

test("ocr_tool's input schema rejects an empty array (min(1) requires at least one file)", () => {
  assert.equal(ocrTool.schema.safeParse([]).success, false);
});

test("ocr_tool's input schema rejects an item missing mimetype/base64", () => {
  assert.equal(
    ocrTool.schema.safeParse([{ mimetype: "image/png" }]).success,
    false,
  );
  assert.equal(
    ocrTool.schema.safeParse([{ base64: "abc123" }]).success,
    false,
  );
});

test("BenhAnSchema accepts a fully-populated record built from its own shape", () => {
  const fixture = buildValidFixture(BenhAnSchema);
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, true);
});

test("BenhAnSchema rejects a record missing a required nested field (e.g. hanh_chinh.ho_ten)", () => {
  const fixture = buildValidFixture(BenhAnSchema) as any;
  delete fixture.hanh_chinh.ho_ten;
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test("BenhAnSchema rejects a record missing a whole top-level section", () => {
  const fixture = buildValidFixture(BenhAnSchema) as any;
  delete fixture.tong_ket;
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, false);
});
