import assert from "node:assert/strict";
import test from "node:test";
import { formatAnswerTemplate } from "../../../src/utils/answerTemplate.js";

test("formats the 3-section template in order with no indented lines", () => {
  const result = formatAnswerTemplate({
    summary: "Tóm tắt ngắn",
    details: "Chi tiết đầy đủ",
    note: "Gợi ý tiếp theo",
  });

  assert.equal(
    result,
    [
      "**Tóm tắt**",
      "Tóm tắt ngắn",
      "",
      "**Chi tiết**",
      "Chi tiết đầy đủ",
      "",
      "**Lưu ý & Bước tiếp theo**",
      "Gợi ý tiếp theo",
    ].join("\n"),
  );

  for (const line of result.split("\n")) {
    assert.ok(!line.startsWith("    "), `line should not be indented: ${line}`);
  }
});

test("preserves multi-line details verbatim (e.g. a bulleted list)", () => {
  const result = formatAnswerTemplate({
    summary: "S",
    details: "- item 1\n- item 2",
    note: "N",
  });

  assert.match(result, /\*\*Chi tiết\*\*\n- item 1\n- item 2\n\n\*\*Lưu ý/);
});
