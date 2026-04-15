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

const handleChatService = async ({ question, userId, token }: ChatInput) => {
  try {
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
      }
    );
    const { data: history } = await axios.get(
      `${process.env.BACKEND_URL}/api/v1/chat-history/context/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const chatHistory = history.data.map((item: any) =>
      item.role === "human"
        ? new HumanMessage(item.content)
        : new AIMessage(item.content)
    );

    const result = await agent.invoke({ messages: chatHistory }, {
      configurable: {
        token,
      },
    } as any);

    const reply = result.messages[result.messages.length - 1] as AIMessage;

    await axios.post(
      `${process.env.BACKEND_URL}/api/v1/chat-history`,
      {
        userId,
        role: "ai",
        content: reply.content,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { answer: reply.content };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const err = new Error("Unauthorized");
      (err as any).status = 401;
      throw err;
    }
    const err = error as Error;
    console.log(err);
    const e = new Error(err.message || "Internal Server Error");
    (e as any).status = 500;
    throw e;
  }
};

const handleCreateReportService = async ({
  question,
}: {
  question: string;
}) => {
  try {
    const result: any = await createReportGraph.invoke({ question });
    const { pdfUrl } = result || {};

    const errorKeys = [
      "errorAnalyzeData",
      "errorChartConfig",
      "errorReport",
      "errorPdf",
    ];

    const errors = errorKeys.map((k) => result[k]).filter(Boolean);

    const finalResult = result?.final_result;

    if ((finalResult && finalResult.success === false) || errors.length > 0) {
      console.error(
        "createReportGraph returned errors or final_result failure:",
        errors,
        finalResult
      );
      const msg = finalResult?.message || "Create report failed";
      const status =
        finalResult?.status || (errors[0] && errors[0].status) || 500;
      const e = new Error(msg);
      (e as any).status = status;
      (e as any).details = errors.length > 0 ? errors : finalResult ?? null;
      throw e;
    }

    return {
      pdfUrl: pdfUrl ?? null,
      raw: result,
    };
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error) && (error as any).response?.status === 401) {
      const e = new Error("Unauthorized");
      (e as any).status = 401;
      throw e;
    }
    throw error;
  }
};

const handleBuildHealthRoadMapService = async ({
  relative_id,
  token,
}: {
  relative_id: number;
  token: string;
}) => {
  try {
    const result: any = await buildHealthRoadmapGraph.invoke({
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
      (e as any).details = errors.length > 0 ? errors : finalResult ?? null;
      throw e;
    }

    return {
      pdfUrl: result?.pdf_url ?? null,
      raw: result,
    };
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error) && (error as any).response?.status === 401) {
      const e = new Error("Unauthorized");
      (e as any).status = 401;
      throw e;
    }
    throw error;
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
      (e as any).details = errors.length > 0 ? errors : finalResult ?? null;
      throw e;
    }

    return {
      answer: result?.answer ?? null,
      raw: result,
    };
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error) && (error as any).response?.status === 401) {
      const e = new Error("Unauthorized");
      (e as any).status = 401;
      throw e;
    }
    throw error;
  }
};

const handleSummaryMedicalRecordService = async (
  fileParams: FileParams
): Promise<string> => {
  try {
    const result = await summaryMedicalRecordGraph.invoke({ fileParams });
    return result.summary.answer;
  } catch (error) {
    throw error;
  }
};

export {
  handleChatService,
  handleCreateReportService,
  handleBuildHealthRoadMapService,
  handleDiagnosisService,
  handleSummaryMedicalRecordService,
};
