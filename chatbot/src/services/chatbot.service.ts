import * as dotenv from "dotenv";
dotenv.config();
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import axios from "axios";
import { randomUUID } from "node:crypto";
import agent from "../agents/agents.js";
import httpClient from "../configs/httpClient.js";
import { getReportAssistantGraph, deletePatientChatThread, getPatientChatGraph } from "../langgraph/reportAssistantRuntime.js";
import { runReportAssistant } from "../langgraph/report_assistant.graph.js";
import { runPatientChat } from "../langgraph/patient_chat.graph.js";
import diagnosisGraph from "../langgraph/diagnosis.graph.js";
import type { ChatInput } from "../types/ChatInput.js";
import type { ReportAssistantInput } from "../types/ReportAssistant.js";
import type { PatientChatInput } from "../types/PatientChat.js";
import { normalizeChatbotError, withRetry } from "../utils/retry.js";
import { logSafeError } from "../utils/safeLog.js";

const BACKEND_REQUEST_TIMEOUT_MS = Number(process.env.BACKEND_REQUEST_TIMEOUT_MS) || 10_000;
const CHAT_HISTORY_CONTEXT_LIMIT = Math.max(1, Number(process.env.CHAT_HISTORY_CONTEXT_LIMIT) || 10);

const handleChatService = async ({ question, userId, token }: ChatInput) => {
  const requestId = randomUUID();
  try {
    await httpClient.post(`${process.env.BACKEND_URL}/api/v1/chat-history`, { userId, role: "human", content: question }, { headers: { Authorization: `Bearer ${token}` }, timeout: BACKEND_REQUEST_TIMEOUT_MS });
    const { data: history } = await withRetry(
      () => httpClient.get(`${process.env.BACKEND_URL}/api/v1/chat-history/context/${userId}`, { headers: { Authorization: `Bearer ${token}` }, timeout: BACKEND_REQUEST_TIMEOUT_MS }),
      { operation: "chat_history_context", totalTimeoutMs: 20_000 },
    );
    const chatHistory = history.data.slice(-CHAT_HISTORY_CONTEXT_LIMIT).map((item: any) => item.role === "human" ? new HumanMessage(item.content) : new AIMessage(item.content));
    const result = await agent.invoke({ messages: chatHistory }, { configurable: { token, requestId } } as any);
    const reply = result.messages[result.messages.length - 1] as AIMessage;
    const bookingToolReply = [...result.messages].reverse().find((message: any) => message._getType?.() === "tool" && message.name === "booking_appointment_tool" && typeof message.content === "string");
    const replyContent = bookingToolReply?.content ?? reply.content;
    try {
      await httpClient.post(`${process.env.BACKEND_URL}/api/v1/chat-history`, { userId, role: "ai", content: replyContent }, { headers: { Authorization: `Bearer ${token}` }, timeout: BACKEND_REQUEST_TIMEOUT_MS });
    } catch (error) {
      console.error("Failed to persist AI reply:", { status: axios.isAxiosError(error) ? error.response?.status : undefined, code: axios.isAxiosError(error) ? error.code : undefined });
    }
    return { answer: replyContent };
  } catch (error) {
    throw normalizeChatbotError(error);
  }
};

const handleReportAssistantService = async (input: ReportAssistantInput) => {
  try {
    return await runReportAssistant(getReportAssistantGraph(), input);
  } catch (error) {
    logSafeError("Report assistant failed", error);
    throw normalizeChatbotError(error);
  }
};

const handlePatientChatService = async (input: PatientChatInput) => {
  try {
    return await runPatientChat(getPatientChatGraph(), input);
  } catch (error) {
    logSafeError("Patient chat failed", error);
    throw normalizeChatbotError(error);
  }
};

const handleDeletePatientChatConversationService = async (userId: number, conversationId: number) => {
  try {
    await deletePatientChatThread(userId, conversationId);
    return { success: true };
  } catch (error) {
    logSafeError("Patient chat checkpoint deletion failed", error);
    throw normalizeChatbotError(error);
  }
};

const handleDiagnosisService = async ({ text_input, relative_id, token }: { text_input: string; relative_id: number; token: string }) => {
  try {
    const result: any = await diagnosisGraph.invoke({ text_input, relative_id, token });
    const errors = ["errorInput", "errorHealthProfile", "errorSymptoms", "errorDiagnosis", "errorSuggestion", "errorLlmAnswer"].map((key) => result[key]).filter(Boolean);
    const finalResult = result?.final_result;
    if ((finalResult && finalResult.success === false) || errors.length > 0) {
      const error = new Error(finalResult?.message || "Diagnosis failed") as Error & { status?: number; code?: string; details?: unknown };
      error.status = finalResult?.status || errors[0]?.status || 500;
      error.code = finalResult?.code ?? errors[0]?.code;
      error.details = errors.length > 0 ? errors : (finalResult ?? null);
      throw error;
    }
    return { answer: result?.answer ?? null };
  } catch (error) {
    logSafeError("Diagnosis failed", error);
    throw normalizeChatbotError(error);
  }
};

export { handleChatService, handleReportAssistantService, handlePatientChatService, handleDeletePatientChatConversationService, handleDiagnosisService };
