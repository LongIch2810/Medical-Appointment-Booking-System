import * as dotenv from "dotenv";
dotenv.config();
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import agent from "../agents/agents.js";
import { ChatInput } from "../types/ChatInput.js";
import axios from "axios";
import httpClient from "../configs/httpClient.js";
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
import { generatePdfMedicalRecordSummary } from "../utils/generatePdfMedicalRecordSummary.js";

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

const handleChatService = async ({ question, userId, token }: ChatInput) => {
  const requestId = randomUUID();

  try {
    await httpClient.post(
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

    const { data: history } = await withRetry(
      () =>
        httpClient.get(
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
    const recentHistory = history.data.slice(-CHAT_HISTORY_CONTEXT_LIMIT);
    const chatHistory = recentHistory.map((item: any) =>
      item.role === "human"
        ? new HumanMessage(item.content)
        : new AIMessage(item.content),
    );

    const result = await agent.invoke({ messages: chatHistory }, {
      configurable: {
        token,
        requestId,
      },
    } as any);

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

    // Await lưu lịch sử AI reply (nhưng vẫn nuốt lỗi, không throw) — nếu
    // không await, response có thể trả về cho frontend trước khi dòng AI
    // được commit xong, và invalidateQueries phía frontend refetch không kịp
    // thấy tin nhắn mới nên optimistic message bị xoá oan (tin nhắn "biến
    // mất" dù AI đã trả lời). Vẫn giữ nguyên tinh thần fix trước: lỗi lưu chỉ
    // log, không làm hỏng câu trả lời đã có sẵn cho người dùng.
    try {
      await httpClient.post(
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
      );
    } catch (error) {
      console.error("Failed to persist AI reply:", {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        code: axios.isAxiosError(error) ? error.code : undefined,
      });
    }

    return { answer: replyContent };
  } catch (error) {
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
  fileName,
}: {
  question: string;
  fileName?: string;
}) => {
  try {
    const result: any = await createReportGraph.invoke({
      question,
      ...(fileName ? { file_name: fileName } : {}),
    });
    const asset = result?.pdf_asset;
    const legacyPdfUrl = result?.pdf_url;

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

    return asset?.publicId
      ? {
          asset,
          raw: {
            result: result?.result ?? null,
            report: result?.report ?? null,
            chartConfig: result?.chartConfig ?? null,
          },
        }
      : {
          pdfUrl: legacyPdfUrl ?? null,
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
  fileName,
}: {
  relative_id: number;
  token: string;
  fileName?: string;
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
      ...(fileName ? { file_name: fileName } : {}),
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

    if (!result?.pdf_asset?.publicId && !result?.pdf_url) {
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

    return result.pdf_asset?.publicId
      ? { asset: result.pdf_asset }
      : { pdfUrl: result.pdf_url };
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
): Promise<{ summary: string; asset: Awaited<ReturnType<typeof generatePdfMedicalRecordSummary>> } | string> => {
  try {
    const result = await summaryMedicalRecordGraph.invoke({ fileParams });
    const summary = result.summary.answer;
    const hasFiles =
      ("imageFiles" in fileParams && fileParams.imageFiles.length > 0) ||
      ("pdfFile" in fileParams && Boolean(fileParams.pdfFile));
    if (!hasFiles) return summary;
    const asset = await generatePdfMedicalRecordSummary(
      summary,
      fileParams.outputFileName,
    );
    return { summary, asset };
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
