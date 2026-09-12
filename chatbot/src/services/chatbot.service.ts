import * as dotenv from "dotenv";
dotenv.config();
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import agent from "../agents/agents.js";
import { ChatInput } from "../types/ChatInput.js";
import axios from "axios";
import createReportGraph from "../langgraph/create_report.graph.js";
import buildHealthRoadmapGraph from "../langgraph/build_health_roadmap.graph.js";
import diagnosisGraph from "../langgraph/diagnosis.graph.js";
import {
  FileParams,
  summaryMedicalRecordGraph,
} from "../langgraph/summary_medical_record.graph.js";
import { randomUUID } from "node:crypto";
import {
  getHealthRoadmapErrorType,
  logHealthRoadmapEvent,
} from "../utils/healthRoadmapRuntime.js";
import { normalizeChatbotError, withRetry } from "../utils/retry.js";
import { logSafeError } from "../utils/safeLog.js";

// Mọi call ra backend đều phải có timeout rõ ràng — trước đây axios dùng
// default (không timeout), request có thể treo vô thời hạn nếu backend
// không phản hồi.
const BACKEND_REQUEST_TIMEOUT_MS =
  Number(process.env.BACKEND_REQUEST_TIMEOUT_MS) || 10_000;

// Keep the prompt bounded as conversations grow while retaining the complete
// history in the backend database.
const CHAT_HISTORY_CONTEXT_LIMIT = Math.max(
  1,
  Number(process.env.CHAT_HISTORY_CONTEXT_LIMIT) || 10,
);

// Đo thời gian tạm thời để xác định bước nào trong pipeline (lưu tin nhắn /
// lấy lịch sử / agent LLM / lưu trả lời) chiếm phần lớn độ trễ — báo cáo
// thực tế cho thấy 1 tin nhắn "hello" đơn giản vẫn có thể timeout dù chatbot
// đã ấm sẵn (không phải cold-start), nên cần số đo thật thay vì đoán.
const handleChatService = async ({ question, userId, token }: ChatInput) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const logStep = (step: string, extra?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        scope: "chatbot_chat_timing",
        requestId,
        step,
        elapsedMs: Date.now() - startedAt,
        ...extra,
      }),
    );
  };

  try {
    let stepStartedAt = Date.now();
    await axios.post(
      `${process.env.BACKEND_URL}/api/v1/chat-history`,
      {
        userId,
        role: "human",
        content: question,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: BACKEND_REQUEST_TIMEOUT_MS,
      },
    );
    logStep("save_human_message", { durationMs: Date.now() - stepStartedAt });

    stepStartedAt = Date.now();
    const { data: history } = await withRetry(
      () =>
        axios.get(
          `${process.env.BACKEND_URL}/api/v1/chat-history/context/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: BACKEND_REQUEST_TIMEOUT_MS,
          },
        ),
      { operation: "chat_history_context", totalTimeoutMs: 20_000 },
    );
    logStep("fetch_history_context", { durationMs: Date.now() - stepStartedAt });
    const recentHistory = history.data.slice(-CHAT_HISTORY_CONTEXT_LIMIT);
    const chatHistory = recentHistory.map((item: any) =>
      item.role === "human"
        ? new HumanMessage(item.content)
        : new AIMessage(item.content),
    );
    logStep("prepare_history_context", {
      messageCount: recentHistory.length,
      historyLimit: CHAT_HISTORY_CONTEXT_LIMIT,
    });

    stepStartedAt = Date.now();
    const result = await agent.invoke({ messages: chatHistory }, {
      configurable: {
        token,
        requestId,
      },
    } as any);
    logStep("agent_invoke", {
      durationMs: Date.now() - stepStartedAt,
      messageCount: result.messages.length,
      toolCallNames: result.messages
        .filter((m: any) => m._getType?.() === "tool")
        .map((m: any) => m.name),
    });

    const reply = result.messages[result.messages.length - 1] as AIMessage;
    const bookingToolReply = [...result.messages]
      .reverse()
      .find(
        (message: any) =>
          message._getType?.() === "tool" &&
          message.name === "booking_appointment_tool" &&
          typeof message.content === "string",
      );
    const replyContent = bookingToolReply?.content ?? reply.content;

    // Không await — lưu lịch sử AI reply không cần chặn response cho người
    // dùng chờ. Trước đây nếu POST này lỗi/timeout thì cả request thất bại
    // dù LLM đã trả lời thành công (tốn chi phí LLM mà người dùng vẫn nhận
    // lỗi). Giờ lỗi lưu chỉ được log, không ảnh hưởng câu trả lời đã có.
    const saveAiMessageStartedAt = Date.now();
    axios
      .post(
        `${process.env.BACKEND_URL}/api/v1/chat-history`,
        {
          userId,
          role: "ai",
          content: replyContent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: BACKEND_REQUEST_TIMEOUT_MS,
        },
      )
      .then(() =>
        logStep("save_ai_message", {
          durationMs: Date.now() - saveAiMessageStartedAt,
        }),
      )
      .catch((error) => {
        logStep("save_ai_message_failed", {
          durationMs: Date.now() - saveAiMessageStartedAt,
        });
        console.error("Failed to persist AI reply:", {
          status: axios.isAxiosError(error) ? error.response?.status : undefined,
          code: axios.isAxiosError(error) ? error.code : undefined,
        });
      });
    logStep("done");

    return { answer: replyContent };
  } catch (error) {
    logStep("failed");
    if (axios.isAxiosError(error)) {
      console.error("Chat service backend error:", {
        method: error.config?.method,
        status: error.response?.status,
        code: error.code,
      });
    }
    throw normalizeChatbotError(error);
  }
};

const handleCreateReportService = async ({
  question,
}: {
  question: string;
}) => {
  try {
    const result: any = await createReportGraph.invoke({ question });
    const { pdf_url: pdfUrl } = result || {};

    const errorKeys = [
      "errorAnalyzeData",
      "errorChartConfig",
      "errorReport",
      "errorPdf",
    ];

    const errors = errorKeys.map((k) => result[k]).filter(Boolean);

    const finalResult = result?.final_result;

    if ((finalResult && finalResult.success === false) || errors.length > 0) {
      console.error("createReportGraph returned a failure", {
        status: finalResult?.status || errors[0]?.status || 500,
        code: finalResult?.code || errors[0]?.code,
      });
      const msg = finalResult?.message || "Create report failed";
      const status =
        finalResult?.status || (errors[0] && errors[0].status) || 500;
      const e = new Error(msg);
      (e as any).status = status;
      (e as any).code = finalResult?.code ?? errors[0]?.code;
      (e as any).details = errors.length > 0 ? errors : (finalResult ?? null);
      throw e;
    }

    return {
      pdfUrl: pdfUrl ?? null,
      raw: {
        result: result?.result ?? null,
        report: result?.report ?? null,
        chartConfig: result?.chartConfig ?? null,
      },
    };
  } catch (error) {
    logSafeError("Create report failed", error);
    throw normalizeChatbotError(error);
  }
};

const handleBuildHealthRoadMapService = async ({
  relative_id,
  token,
}: {
  relative_id: number;
  token: string;
}) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logHealthRoadmapEvent({
    requestId,
    relativeId: relative_id,
    event: "roadmap_started",
  });

  try {
    const result: any = await buildHealthRoadmapGraph.invoke({
      request_id: requestId,
      relative_id,
      token,
    });

    const errorKeys = [
      "errorHealthProfile",
      "errorHealthMetric",
      "errorProgressData",
      "errorChartConfig",
      "errorHealthPlan",
      "errorHealthRoadmapReport",
      "errorPdf",
    ];

    const errors = errorKeys.map((k) => result[k]).filter(Boolean);

    const finalResult = result?.final_result;

    if ((finalResult && finalResult.success === false) || errors.length > 0) {
      const msg = finalResult?.message || "Build health roadmap failed";
      const status =
        finalResult?.status || (errors[0] && errors[0].status) || 500;
      const e = new Error(msg);
      (e as any).status = status;
      (e as any).code = finalResult?.code ?? errors[0]?.code;
      (e as any).details = errors.length > 0 ? errors : (finalResult ?? null);
      throw e;
    }

    if (!result?.pdf_url) {
      const e = new Error("Không nhận được đường dẫn PDF từ chatbot.");
      (e as any).status = 500;
      throw e;
    }

    logHealthRoadmapEvent({
      requestId,
      relativeId: relative_id,
      event: "roadmap_succeeded",
      durationMs: Date.now() - startedAt,
      status: 200,
    });

    return {
      pdfUrl: result.pdf_url,
    };
  } catch (error: unknown) {
    const status =
      typeof error === "object" && error
        ? ((error as { status?: number }).status ?? 500)
        : 500;
    logHealthRoadmapEvent({
      requestId,
      relativeId: relative_id,
      event: "roadmap_request_failed",
      durationMs: Date.now() - startedAt,
      status,
      errorType: getHealthRoadmapErrorType(error),
    });

    throw normalizeChatbotError(error);
  }
};

const handleDiagnosisService = async ({
  text_input,
  relative_id,
  token,
}: {
  text_input: string;
  relative_id: number;
  token: string;
}) => {
  try {
    const result: any = await diagnosisGraph.invoke({
      text_input,
      relative_id,
      token,
    });

    const errorKeys = [
      "errorInput",
      "errorHealthProfile",
      "errorSymptoms",
      "errorDiagnosis",
      "errorSuggestion",
      "errorLlmAnswer",
    ];

    const errors = errorKeys.map((k) => result[k]).filter(Boolean);
    const finalResult = result?.final_result;

    if ((finalResult && finalResult.success === false) || errors.length > 0) {
      const msg = finalResult?.message || "Diagnosis failed";
      const status =
        finalResult?.status || (errors[0] && errors[0].status) || 500;
      const e = new Error(msg);
      (e as any).status = status;
      (e as any).code = finalResult?.code ?? errors[0]?.code;
      (e as any).details = errors.length > 0 ? errors : (finalResult ?? null);
      throw e;
    }

    return {
      answer: result?.answer ?? null,
    };
  } catch (error) {
    logSafeError("Diagnosis failed", error);
    throw normalizeChatbotError(error);
  }
};

const handleSummaryMedicalRecordService = async (
  fileParams: FileParams,
): Promise<string> => {
  try {
    const result = await summaryMedicalRecordGraph.invoke({ fileParams });
    return result.summary.answer;
  } catch (error) {
    throw normalizeChatbotError(error);
  }
};

export {
  handleChatService,
  handleCreateReportService,
  handleBuildHealthRoadMapService,
  handleDiagnosisService,
  handleSummaryMedicalRecordService,
};
