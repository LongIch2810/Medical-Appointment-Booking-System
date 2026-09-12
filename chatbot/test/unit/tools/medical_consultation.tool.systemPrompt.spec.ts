import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { BaseMessage } from "@langchain/core/messages";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

// Proves the actual regression this item fixes: the safety rules used to
// live only in the tool's `description` (which the OUTER agent reads to
// decide whether to call the tool) and were never sent to the model that
// generates the medical answer. Mock the LLM the tool invokes and inspect
// the messages it actually receives.
type Capture = { invokedMessages: BaseMessage[][] };
const globals = globalThis as typeof globalThis & { __MED_TOOL_CAPTURE__: Capture };
globals.__MED_TOOL_CAPTURE__ = { invokedMessages: [] };

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/tools")).href + "/";

registerEsmMocks(subjectDirUrl, {
  "../configs/llm.js": `
    import { AIMessage } from "@langchain/core/messages";
    export function getChatModel() {
      return {
        invoke: async (messages) => {
          globalThis.__MED_TOOL_CAPTURE__.invokedMessages.push(messages);
          return new AIMessage("stubbed medical answer");
        },
      };
    }
  `,
});

const { medicalConsultationTool, detectEmergencyRedFlags } = await import(
  "../../../src/tools/medical_consultation.tool.js"
);

test.beforeEach(() => {
  globals.__MED_TOOL_CAPTURE__ = { invokedMessages: [] };
});

test("sends a SystemMessage with the safety rules to the model, not just in the tool description", async () => {
  await medicalConsultationTool.invoke({ question: "Đau đầu nên làm gì?" });

  const [messages] = globals.__MED_TOOL_CAPTURE__.invokedMessages;
  assert.equal(messages.length, 2);
  assert.equal(messages[0]._getType(), "system");
  assert.match(
    String(messages[0].content),
    /không (?:được )?thay thế bác sĩ/i,
  );
  assert.match(
    String(messages[0].content),
    /không tự ý đề nghị thay đổi/i,
  );
  assert.match(String(messages[0].content), /ngưng bất kỳ thuốc nào/i);
  assert.match(String(messages[0].content), /\*\*Tóm tắt\*\*/);
  assert.match(String(messages[0].content), /\*\*Chi tiết\*\*/);
  assert.match(String(messages[0].content), /\*\*Lưu ý & Bước tiếp theo\*\*/);
  assert.equal(messages[1]._getType(), "human");
  assert.equal(String(messages[1].content), "Đau đầu nên làm gì?");
});

test("prepends an emergency disclaimer to the answer when the question contains a red flag", async () => {
  const result = await medicalConsultationTool.invoke({
    question: "Tôi bị đau ngực dữ dội và khó thở",
  });

  assert.equal(detectEmergencyRedFlags("Tôi bị đau ngực dữ dội và khó thở"), true);
  assert.match(result as string, /^⚠️/);
  assert.match(result as string, /115/);
  assert.match(result as string, /stubbed medical answer/);
});

test("does not prepend the emergency disclaimer for an ordinary question", async () => {
  const result = await medicalConsultationTool.invoke({
    question: "Cách phòng ngừa cảm cúm mùa đông?",
  });

  assert.equal(result, "stubbed medical answer");
});
