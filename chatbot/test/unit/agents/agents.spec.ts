import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type GuardMode = "in_scope" | "out_of_scope" | "throw" | "undefined";
type AgentStub = {
  mode: "direct" | "tool" | "booking";
  llmCalls: unknown[];
  toolCalls: unknown[];
  guardCalls: unknown[];
  guardMode: GuardMode;
};
const globals = globalThis as typeof globalThis & { __AGENT_STUB__: AgentStub };
globals.__AGENT_STUB__ = {
  mode: "direct",
  llmCalls: [],
  toolCalls: [],
  guardCalls: [],
  guardMode: "in_scope",
};

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl =
  pathToFileURL(path.resolve(here, "../../../src/agents")).href + "/";
const toolModule = (exportName: string, toolName: string) => `
  import { tool } from "@langchain/core/tools";
  import { z } from "zod";
  export const ${exportName} = tool(
    async (args) => {
      globalThis.__AGENT_STUB__.toolCalls.push({ name: "${toolName}", args });
      return "tool result";
    },
    { name: "${toolName}", description: "test tool", schema: z.object({ question: z.string().optional() }) },
  );
`;

registerEsmMocks(subjectDirUrl, {
  "../tools/rag.tool.js": toolModule("ragTool", "rag_tool"),
  "../tools/qa_sql.tool.js": toolModule("qaSqlTool", "qa_sql_tool"),
  "../tools/medical_consultation.tool.js": toolModule(
    "medicalConsultationTool",
    "medical_consultation_tool",
  ),
  "../tools/booking_appointment.tool.js": toolModule(
    "bookingAppointmentTool",
    "booking_appointment_tool",
  ),
  "../configs/llm.js": `
    import { AIMessage } from "@langchain/core/messages";
    export function getChatModel() {
      return {
        bindTools: () => ({
          invoke: async (messages) => {
            const state = globalThis.__AGENT_STUB__;
            state.llmCalls.push(messages);
            if (state.mode === "tool" && state.llmCalls.length === 1) {
              return new AIMessage({
                content: "",
                tool_calls: [{ name: "rag_tool", args: { question: "q" }, id: "call-1", type: "tool_call" }],
              });
            }
            if (state.mode === "booking" && state.llmCalls.length === 1) {
              return new AIMessage({
                content: "",
                tool_calls: [{ name: "booking_appointment_tool", args: {}, id: "call-1", type: "tool_call" }],
              });
            }
            return new AIMessage("final answer");
          },
        }),
        withStructuredOutput: () => ({
          invoke: async (messages) => {
            const state = globalThis.__AGENT_STUB__;
            state.guardCalls.push(messages);
            if (state.guardMode === "throw") throw new Error("guard failed");
            if (state.guardMode === "undefined") return undefined;
            return { in_scope: state.guardMode !== "out_of_scope" };
          },
        }),
      };
    }
  `,
});

const { default: agent } = await import("../../../src/agents/agents.js");

test.beforeEach(() => {
  globals.__AGENT_STUB__ = {
    mode: "direct",
    llmCalls: [],
    toolCalls: [],
    guardCalls: [],
    guardMode: "in_scope",
  };
});

test("ends after one model call when the response has no tool calls", async () => {
  const result = await agent.invoke({ messages: [] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 1);
  assert.equal(globals.__AGENT_STUB__.toolCalls.length, 0);
  assert.equal(result.messages.at(-1)?.content, "final answer");
});

test("prepends the product safety SystemMessage to every model call, ahead of conversation history", async () => {
  const history = [new HumanMessage("hi")];

  await agent.invoke({ messages: history });

  const [firstCallMessages] = globals.__AGENT_STUB__.llmCalls as [unknown[]];
  assert.equal((firstCallMessages[0] as { _getType(): string })._getType(), "system");
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /không thay thế bác sĩ/,
  );
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /115/,
  );
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /CHỈ hỗ trợ các nội dung liên quan đến sức khỏe/,
  );
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /\*\*Tóm tắt\*\*/,
  );
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /\*\*Chi tiết\*\*/,
  );
  assert.match(
    (firstCallMessages[0] as { content: string }).content,
    /\*\*Lưu ý & Bước tiếp theo\*\*/,
  );
  assert.equal((firstCallMessages[1] as HumanMessage).content, "hi");
});

test("routes model tool calls through ToolNode and then returns to the model", async () => {
  globals.__AGENT_STUB__.mode = "tool";

  const result = await agent.invoke({ messages: [] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 2);
  assert.deepEqual(globals.__AGENT_STUB__.toolCalls, [
    { name: "rag_tool", args: { question: "q" } },
  ]);
  assert.equal(result.messages.at(-1)?.content, "final answer");
});

test("ends right after booking_appointment_tool instead of calling the model again", async () => {
  globals.__AGENT_STUB__.mode = "booking";

  const result = await agent.invoke({ messages: [] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 1);
  assert.deepEqual(globals.__AGENT_STUB__.toolCalls, [
    { name: "booking_appointment_tool", args: {} },
  ]);
  assert.equal(result.messages.at(-1)?.content, "tool result");
});

test("topic guard: refuses an out-of-scope message without ever invoking the main agent", async () => {
  globals.__AGENT_STUB__.guardMode = "out_of_scope";

  const result = await agent.invoke({ messages: [new HumanMessage("viết cho tôi 1 bài thơ")] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 0);
  assert.equal(globals.__AGENT_STUB__.guardCalls.length, 1);
  assert.match(
    String(result.messages.at(-1)?.content),
    /chỉ có thể hỗ trợ các câu hỏi về sức khỏe/,
  );
});

test("topic guard: an in-scope message proceeds to the main agent as before", async () => {
  globals.__AGENT_STUB__.guardMode = "in_scope";

  const result = await agent.invoke({ messages: [new HumanMessage("tôi bị đau đầu")] });

  assert.equal(globals.__AGENT_STUB__.guardCalls.length, 1);
  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 1);
  assert.equal(result.messages.at(-1)?.content, "final answer");
});

test("topic guard: sends the full recent history (not just the latest message) so greetings mid-conversation aren't misclassified", async () => {
  const history = [
    new HumanMessage("tôi bị đau đầu"),
    new AIMessage("Bạn nên đi khám chuyên khoa thần kinh."),
    new HumanMessage("cảm ơn bạn"),
  ];

  await agent.invoke({ messages: history });

  const [guardMessages] = globals.__AGENT_STUB__.guardCalls as [unknown[]];
  // guardMessages[0] is the guard's own SystemMessage; the rest is the
  // conversation history it was asked to classify.
  assert.equal(guardMessages.length, 1 + history.length);
});

test("topic guard: fails open (proceeds to the agent) when the classifier throws", async () => {
  globals.__AGENT_STUB__.guardMode = "throw";

  const result = await agent.invoke({ messages: [new HumanMessage("hi")] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 1);
  assert.equal(result.messages.at(-1)?.content, "final answer");
});

test("topic guard: fails open when the classifier returns undefined (gateway didn't actually call the function)", async () => {
  globals.__AGENT_STUB__.guardMode = "undefined";

  const result = await agent.invoke({ messages: [new HumanMessage("hi")] });

  assert.equal(globals.__AGENT_STUB__.llmCalls.length, 1);
  assert.equal(result.messages.at(-1)?.content, "final answer");
});
