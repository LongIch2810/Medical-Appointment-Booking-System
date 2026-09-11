import assert from "node:assert/strict";
import test from "node:test";
import { GetHealthProfileTool } from "../../../src/tools/get_health_profile.tool.js";

// GetHealthProfileTool's func makes a real axios call (wrapped in withRetry)
// to the backend for the success/error-from-API paths, and there is no
// dependency-injection seam to substitute axios with a fake — so those paths
// aren't exercised here to avoid hitting a real/unreachable service. The
// "not logged in" guard, however, returns before any network call is made and
// is real, independently-testable branch logic.

test("returns a Vietnamese not-logged-in message and short-circuits before any backend call when token is empty", async () => {
  const result = await GetHealthProfileTool.invoke({ relative_id: 1, token: "" });
  assert.equal(
    result,
    "Lỗi: Người dùng chưa đăng nhập. Không thể lấy hồ sơ sức khỏe của bạn.",
  );
});

test("exposes the expected tool name and description", () => {
  assert.equal(GetHealthProfileTool.name, "get_health_profile_tool");
  assert.match(GetHealthProfileTool.description, /hồ sơ sức khỏe/);
});

test("schema requires relative_id (number) and token (string)", () => {
  const valid = GetHealthProfileTool.schema.safeParse({
    relative_id: 5,
    token: "some-jwt",
  });
  assert.equal(valid.success, true);

  const missingToken = GetHealthProfileTool.schema.safeParse({ relative_id: 5 });
  assert.equal(missingToken.success, false);

  const wrongType = GetHealthProfileTool.schema.safeParse({
    relative_id: "5",
    token: "some-jwt",
  });
  assert.equal(wrongType.success, false);
});
