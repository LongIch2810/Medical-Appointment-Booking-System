import 'dotenv/config';
import pg from 'pg';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';
import type { ReportAssistantGraph } from './report_assistant.graph.js';
import { createReportAssistantGraph } from './report_assistant.graph.js';
import type { PatientChatGraph } from './patient_chat.graph.js';
import { createPatientChatGraph, getPatientChatThreadId } from './patient_chat.graph.js';
import { ChatbotOperationError } from '../utils/retry.js';
import { logSafeError } from '../utils/safeLog.js';

const { Pool } = pg;
const LANGGRAPH_SCHEMA = 'langgraph';
const REQUIRED_LANGGRAPH_ROLE = 'chatbot_report_assistant';

type Runtime = {
  graph: ReportAssistantGraph;
  patientChatGraph: PatientChatGraph;
  checkpointer: PostgresSaver;
  store: PostgresStore;
};

let runtime: Runtime | null = null;
let initialization: Promise<Runtime> | null = null;
let initializationFailed = false;

function postgresOptions(): pg.PoolConfig {
  const user = process.env.LANGGRAPH_DB_USER;
  const password = process.env.LANGGRAPH_DB_PASSWORD;
  const database = process.env.DB_NAME;
  const host = process.env.DB_HOST;
  const port = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
  if (
    user !== REQUIRED_LANGGRAPH_ROLE ||
    !password ||
    password.length < 16 ||
    !database ||
    !host ||
    !Number.isSafeInteger(port)
  ) {
    throw new Error('LangGraph PostgreSQL configuration is incomplete.');
  }
  return {
    host,
    port,
    database,
    user,
    password,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    application_name: 'lifehealth-chatbot-langgraph',
    options: `-c search_path=${LANGGRAPH_SCHEMA} -c statement_timeout=15000`,
  };
}

async function initialize(): Promise<Runtime> {
  let checkpointer: PostgresSaver | undefined;
  let store: PostgresStore | undefined;
  let pool: pg.Pool | undefined;
  try {
    const connectionOptions = postgresOptions();
    pool = new Pool(connectionOptions);
    checkpointer = new PostgresSaver(pool, undefined, { schema: LANGGRAPH_SCHEMA });
    store = new PostgresStore({
      connectionOptions,
      schema: LANGGRAPH_SCHEMA,
      ensureTables: true,
    });

    // Each native LangGraph persistence component applies its own versioned
    // migrations, once per process startup, before any request can use it.
    await checkpointer.setup();
    await store.setup();

    const graph = createReportAssistantGraph().compile({ checkpointer, store });
    const patientChatGraph = createPatientChatGraph().compile({ checkpointer, store });
    runtime = { graph, patientChatGraph, checkpointer, store };
    return runtime;
  } catch (error) {
    if (store) await store.stop().catch(() => undefined);
    if (checkpointer) await checkpointer.end().catch(() => undefined);
    else if (pool) await pool.end().catch(() => undefined);
    logSafeError('[report_assistant] persistence initialization failed', error);
    initializationFailed = true;
    throw unavailable(error);
  }
}

function unavailable(cause?: unknown) {
  return new ChatbotOperationError({
    status: 503,
    code: 'REPORT_ASSISTANT_STATE_UNAVAILABLE',
    message: 'Report assistant state is unavailable.',
    retryable: true,
    cause,
  });
}

export async function initializeReportAssistantRuntime(): Promise<void> {
  if (runtime) return;
  if (initializationFailed) throw unavailable();
  initialization ??= initialize();
  await initialization;
}

export function getReportAssistantGraph(): ReportAssistantGraph {
  if (!runtime) throw unavailable();
  return runtime.graph;
}

export function getPatientChatGraph(): PatientChatGraph {
  if (!runtime) {
    throw new ChatbotOperationError({
      status: 503,
      code: 'PATIENT_CHAT_STATE_UNAVAILABLE',
      message: 'Patient chat state is unavailable.',
      retryable: true,
    });
  }
  return runtime.patientChatGraph;
}

export async function deletePatientChatThread(userId: number, conversationId: number): Promise<void> {
  if (!runtime) {
    throw new ChatbotOperationError({
      status: 503,
      code: 'PATIENT_CHAT_STATE_UNAVAILABLE',
      message: 'Patient chat state is unavailable.',
      retryable: true,
    });
  }
  const threadId = getPatientChatThreadId(userId, conversationId);
  try {
    await runtime.checkpointer.deleteThread(threadId);
  } catch (error) {
    logSafeError('[patient_chat] checkpoint deletion failed', error);
    throw new ChatbotOperationError({
      status: 503,
      code: 'PATIENT_CHAT_STATE_UNAVAILABLE',
      message: 'Patient chat state could not be deleted.',
      retryable: true,
      cause: error,
    });
  }
}

export function isReportAssistantRuntimeReady() {
  return runtime !== null;
}

async function closeRuntime() {
  if (!runtime) return;
  const current = runtime;
  runtime = null;
  await current.store.stop().catch(() => undefined);
  await current.checkpointer.end().catch(() => undefined);
}

process.once('SIGTERM', () => void closeRuntime());
process.once('SIGINT', () => void closeRuntime());
