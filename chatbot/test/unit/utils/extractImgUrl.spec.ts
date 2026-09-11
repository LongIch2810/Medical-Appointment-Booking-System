import assert from "node:assert/strict";
import test from "node:test";
import { extractImgUrl } from "../../../src/utils/extractImgUrl.js";

test("builds a data URL from mimetype and base64 payload", () => {
  const url = extractImgUrl({ mimetype: "image/png", base64: "abc123==" });
  assert.equal(url, "data:image/png;base64,abc123==");
});

test("supports different mimetypes verbatim", () => {
  const url = extractImgUrl({ mimetype: "image/jpeg", base64: "ZmFrZQ==" });
  assert.equal(url, "data:image/jpeg;base64,ZmFrZQ==");
});

test("handles an empty base64 string", () => {
  const url = extractImgUrl({ mimetype: "image/png", base64: "" });
  assert.equal(url, "data:image/png;base64,");
});

test("does not validate or transform the mimetype/base64 content", () => {
  // The function is a pure formatter — garbage in, garbage out.
  const url = extractImgUrl({ mimetype: "not-a-mimetype", base64: "not base64!!" });
  assert.equal(url, "data:not-a-mimetype;base64,not base64!!");
});
