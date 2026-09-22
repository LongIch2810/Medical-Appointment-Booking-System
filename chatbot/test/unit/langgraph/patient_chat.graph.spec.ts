import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { InMemoryStore, MemorySaver } from '@langchain/langgraph';
import { registerEsmMocks } from '../_helpers/registerMocks.mjs';
import type { PatientChatInput } from '../../../src/types/PatientChat.js';

type GraphStub = {
  nextAgentMessage: AIMessage | ToolMessage;
  agentCalls: unknown[];
  memoryCommand: unknown;
  commits: unknown[];
  preferences: Record<string, unknown> | null;
};

const globals = globalThis as typeof globalThis & { __PATIENT_CHAT_GRAPH_STUB__: GraphStub };
function resetStub() {
  globals.__PATIENT_CHAT_GRAPH_STUB__ = {
    nextAgentMessage: new AIMessage('Answer'),
    agentCalls: [],
    memoryCommand: { action: 'UNSUPPORTED', field: null, preference: null },
    commits: [],
    preferences: null,
  };
}
resetStub();

const here = path.dirname(fileURLToPath(import.meta.url));
const subjectDirUrl = pathToFileURL(path.resolve(here, '../../../src/langgraph')).href + '/';
registerEsmMocks(subjectDirUrl, {
  '../agents/agents.js': `
    export default { invoke: async (input) => {
      const state = globalThis.__PATIENT_CHAT_GRAPH_STUB__;
      state.agentCalls.push(input.messages);
      return { messages: [...input.messages, state.nextAgentMessage] };
    } };
  `,
  '../configs/llm.js': `
    export function getChatModel() {
      return { withStructuredOutput: () => ({ invoke: async () => globalThis.__PATIENT_CHAT_GRAPH_STUB__.memoryCommand }) };
    }
  `,
  './booking.graph.js': `
    export async function commitBookingProposal(...args) {
      const state = globalThis.__PATIENT_CHAT_GRAPH_STUB__;
      state.commits.push(args);
      return { id: 51, doctor: {}, doctor_schedule: {} };
    }
  `,
  '../tools/booking_appointment.tool.js': `
    export function formatBookingResult() { return 'Booking completed'; }
  `,
  '../utils/safeLog.js': `export function logSafeError() {}`,
});

const { createPatientChatGraph, runPatientChat } = await import('../../../src/langgraph/patient_chat.graph.js');

test('loads saved scheduling preferences into trusted context for another thread', async () => {
  resetStub();
  const graph = makeGraph();
  globals.__PATIENT_CHAT_GRAPH_STUB__.memoryCommand = {
    action: 'WRITE',
    field: null,
    preference: { preferredTimeOfDay: 'MORNING' },
  };
  await runPatientChat(graph, makeInput({ message: 'Remember I prefer morning appointments.' }));

  globals.__PATIENT_CHAT_GRAPH_STUB__.memoryCommand = {
    action: 'UNSUPPORTED',
    field: null,
    preference: null,
  };
  await runPatientChat(graph, makeInput({
    conversationId: 12,
    threadId: 'patient-chat:v1:7:12',
    message: 'I would like to book an appointment.',
  }));

  const promptMessages = globals.__PATIENT_CHAT_GRAPH_STUB__.agentCalls.at(-1) as Array<{ content: unknown }>;
  assert.match(String(promptMessages[0].content), /preferredTimeOfDay.*MORNING/);
  assert.match(String(promptMessages[0].content), /soft scheduling preferences/);
});

function makeInput(overrides: Partial<PatientChatInput> = {}): PatientChatInput {
  const userId = overrides.userId ?? 7;
  const conversationId = overrides.conversationId ?? 11;
  return {
    userId,
    conversationId,
    turnId: overrides.turnId ?? 'e9ed5cae-574c-4f32-bfef-c5fc141c11db',
    threadId: `patient-chat:v1:${userId}:${conversationId}`,
    mode: 'MESSAGE',
    message: 'Xin chào',
    historySeed: [{ role: 'user', content: 'Xin chào' }],
    token: 'not-to-be-checkpointed',
    ...overrides,
  };
}

function makeGraph() {
  return createPatientChatGraph().compile({
    checkpointer: new MemorySaver(),
    store: new InMemoryStore(),
  });
}

test('patient chat checkpoints each thread and does not persist the bearer token', async () => {
  resetStub();
  const graph = makeGraph();
  const input = makeInput();
  const response = await runPatientChat(graph, input);
  assert.equal(response.action, 'ANSWER');
  const first = await graph.getState({ configurable: { thread_id: input.threadId } });
  assert.equal(first.values.conversationId, input.conversationId);
  assert.equal(JSON.stringify(first.values).includes(input.token), false);

  const otherThread = makeInput({ conversationId: 12, threadId: 'patient-chat:v1:7:12' });
  const other = await graph.getState({ configurable: { thread_id: otherThread.threadId } });
  assert.deepEqual(other.values, {});
});

test('booking proposal pauses in interrupt and only a matching approval commits once', async () => {
  resetStub();
  const operationId = '4d7f8c38-b3a4-47a0-9cb3-2d7a48ed98e8';
  const bookingSummary = {
    patientName: 'Nguyễn An',
    createsRelative: false,
    specialtyName: 'Nội tổng quát',
    appointmentDate: '2026-09-22',
    startTime: '09:00',
    endTime: '09:30',
  };
  globals.__PATIENT_CHAT_GRAPH_STUB__.nextAgentMessage = new ToolMessage({
    content: JSON.stringify({
      type: 'PATIENT_BOOKING_PROPOSAL',
      operationId,
      proposal: {
        relative_id: 8,
        appointment_date: bookingSummary.appointmentDate,
        specialty_id: 3,
        start_time: bookingSummary.startTime,
        booking_mode: 'ai_select',
        display: bookingSummary,
      },
    }),
    name: 'booking_appointment_tool',
    tool_call_id: 'booking-call-1',
  });
  const graph = makeGraph();
  const input = makeInput({ message: 'Đặt lịch khám ngày 22/09', historySeed: [{ role: 'user', content: 'Đặt lịch khám ngày 22/09' }] });
  const proposal = await runPatientChat(graph, input);
  assert.equal(proposal.action, 'BOOKING_APPROVAL');
  assert.equal(globals.__PATIENT_CHAT_GRAPH_STUB__.commits.length, 0);

  const confirmation = makeInput({
    mode: 'RESUME_BOOKING',
    message: undefined,
    historySeed: undefined,
    turnId: '723693c0-bd0c-4a04-b7b0-6f18dd9842f1',
    decision: 'APPROVE',
    approvalMessageId: 99,
    operationId,
    bookingSummary,
  });
  const confirmed = await runPatientChat(graph, confirmation);
  assert.equal(confirmed.action, 'BOOKING_CONFIRMED');
  assert.equal(globals.__PATIENT_CHAT_GRAPH_STUB__.commits.length, 1);
  assert.equal((globals.__PATIENT_CHAT_GRAPH_STUB__.commits[0] as unknown[])[2], operationId);
});

test('a normal message while approval is pending revises the plan without committing', async () => {
  resetStub();
  const operationId = '4d7f8c38-b3a4-47a0-9cb3-2d7a48ed98e8';
  const bookingSummary = {
    patientName: 'Nguyễn An',
    createsRelative: false,
    specialtyName: 'Nội tổng quát',
    appointmentDate: '2026-09-22',
    startTime: '09:00',
    endTime: '09:30',
  };
  globals.__PATIENT_CHAT_GRAPH_STUB__.nextAgentMessage = new ToolMessage({
    content: JSON.stringify({ type: 'PATIENT_BOOKING_PROPOSAL', operationId, proposal: { display: bookingSummary } }),
    name: 'booking_appointment_tool',
    tool_call_id: 'booking-call-2',
  });
  const graph = makeGraph();
  const first = makeInput({ message: 'Đặt lịch', historySeed: [{ role: 'user', content: 'Đặt lịch' }] });
  await runPatientChat(graph, first);
  globals.__PATIENT_CHAT_GRAPH_STUB__.nextAgentMessage = new AIMessage('Đã hiểu, mình sẽ tìm khung giờ khác.');
  const revision = makeInput({
    mode: 'RESUME_BOOKING',
    message: 'Đổi sang buổi chiều',
    historySeed: undefined,
    turnId: '723693c0-bd0c-4a04-b7b0-6f18dd9842f1',
    decision: 'REVISE',
    approvalMessageId: 99,
    operationId,
    bookingSummary,
  });
  const response = await runPatientChat(graph, revision);
  assert.equal(response.action, 'ANSWER');
  assert.equal(globals.__PATIENT_CHAT_GRAPH_STUB__.commits.length, 0);
  assert.ok(globals.__PATIENT_CHAT_GRAPH_STUB__.agentCalls.length >= 2);
});

test('long-term preferences are scoped to the user and shared across that user’s threads', async () => {
  resetStub();
  const graph = makeGraph();
  globals.__PATIENT_CHAT_GRAPH_STUB__.memoryCommand = {
    action: 'WRITE',
    field: null,
    preference: { preferredTimeOfDay: 'MORNING' },
  };
  const memoryInput = makeInput({ message: 'Hãy nhớ tôi thường muốn khám buổi sáng' });
  const written = await runPatientChat(graph, memoryInput);
  assert.equal(written.action, 'MEMORY_RESULT');

  globals.__PATIENT_CHAT_GRAPH_STUB__.memoryCommand = { action: 'READ', field: null, preference: null };
  const read = await runPatientChat(graph, makeInput({
    conversationId: 12,
    threadId: 'patient-chat:v1:7:12',
    message: 'Bạn đang nhớ gì về sở thích của tôi?',
  }));
  assert.match(read.message, /MORNING/);
  const differentUser = await runPatientChat(graph, makeInput({
    userId: 8,
    conversationId: 13,
    threadId: 'patient-chat:v1:8:13',
    message: 'Bạn đang nhớ gì về sở thích của tôi?',
  }));
  assert.match(differentUser.message, /chưa lưu/);
});
