import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { HumanMessage } from "@langchain/core/messages";
import { registerEsmMocks } from "../_helpers/registerMocks.mjs";

type AgentStub = { mode: "direct" | "tool"; llmCalls: unknown[]; toolCalls: unknown[] };
const globals = globalThis as typeof globalThis & { __AGENT_STUB__: AgentStub };
globals.__AGENT_STUB__ = { mode: "direct", llmCalls: [], toolCalls: [] };

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
            return new AIMessage("final answer");
          },
        }),
      };
    }
  `,
});

const { default: agent } = await import("../../../src/agents/agents.js");

test.beforeEach(() => {
  globals.__AGENT_STUB__ = { mode: "direct", llmCalls: [], toolCalls: [] };
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
