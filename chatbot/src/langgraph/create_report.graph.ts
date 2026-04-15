import { DynamicStructuredTool } from "@langchain/core/tools";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import {
  ChartSchema,
  GenerateChartConfigTool,
} from "../tools/generate_chat_config.tool.js";
import {
  ReportSchema,
  WriteProfessionalReportTool,
} from "../tools/write_professional_report.tool.js";
import { AdminQaSqlTool } from "../tools/admin_qa_sql.tool.js";
import { generatePdfReport } from "../utils/generatePdfReport.js";
import { renderChartToImage } from "../utils/renderChartToImage.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

type ChartConfig = z.infer<typeof ChartSchema>;
type Report = z.infer<typeof ReportSchema>;

const CreateReportState = Annotation.Root({
  question: Annotation<string>(),
  result: Annotation<string>(),
  chartConfig: Annotation<ChartConfig>(),
  report: Annotation<Report>(),
  pdf_url: Annotation<string>(),
  errorAnalyzeData: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeAnalyzeData: Annotation<string>(),

  errorChartConfig: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeChartConfig: Annotation<string>(),

  errorReport: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeReport: Annotation<string>(),

  errorPdf: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodePdf: Annotation<string>(),

  final_result: Annotation<{
    status: number;
    success: boolean;
    message: string;
  } | null>(),
});

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>
) {
  const result = await tool.invoke(args);
  return result;
}

async function LLMGenerateErrorAnswerNode(
  state: typeof CreateReportState.State
) {
  try {
    const errorSchema = z.object({
      status: z
        .number()
        .describe("Mã trạng thái HTTP mô phỏng lỗi (ví dụ 400, 404, 500)."),
      error_detail: z
        .string()
        .describe(
          "Thông điệp lỗi thân thiện và dễ hiểu dành cho người dùng cuối, bằng tiếng Việt."
        ),
    });
    const errors = [
      state.errorAnalyzeData,
      state.errorChartConfig,
      state.errorReport,
      state.errorPdf,
    ].filter(Boolean);

    if (errors.length === 0) {
      return {
        final_result: {
          status: 200,
          success: true,
          message: "Không phát hiện lỗi nào, quá trình tạo báo cáo thành công.",
        },
      };
    }
    const systemPrompt = `
Bạn là một trợ lý thông minh chuyên diễn giải lỗi hệ thống thành ngôn ngữ thân thiện cho người dùng.
Hãy đọc dữ liệu JSON "errorSummary" bên dưới, trong đó chứa các thông tin lỗi từ các bước khác nhau.
Nhiệm vụ:
- Xác định bước nào bị lỗi (ví dụ: phân tích dữ liệu, tạo biểu đồ, sinh báo cáo, tạo PDF).
- Giải thích lỗi bằng tiếng Việt dễ hiểu (thay vì lỗi kỹ thuật).
- Gợi ý cho người dùng phải làm gì (ví dụ: kiểm tra lại câu hỏi, nhập dữ liệu khác, thử lại sau, hoặc liên hệ quản trị viên).
`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      [
        "human",
        "Dưới đây là danh sách lỗi cần diễn giải:\n\n{errors}\n\nHãy trả về lời nhắn thân thiện cho người dùng.",
      ],
    ]);
    const llm = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3,
    });
    const structuredModel = llm.withStructuredOutput(errorSchema);

    const pipeline = promptTemplate.pipe(structuredModel);
    const res = await pipeline.invoke({
      errors: JSON.stringify(errors, null, 2),
    });

    return {
      final_result: {
        status: res.status,
        success: false,
        message: res.error_detail,
      },
    };
  } catch (error) {
    return {
      final_result: {
        status: 500,
        success: false,
        message:
          "Hệ thống đang gặp sự cố khi tạo thông báo lỗi. Vui lòng thử lại sau.",
      },
    };
  }
}

async function analyzeDataNode(state: typeof CreateReportState.State) {
  try {
    if (!state.question || state.question.trim().length < 5) {
      return {
        errorAnalyzeData: {
          status: 400,
          message: "Câu hỏi không hợp lệ. Vui lòng nhập câu hỏi có ý nghĩa.",
          node: "analyze_data_node",
        },
        nextNodeAnalyzeData: "llm_generate_error_answer_node",
      };
    }

    console.log("🧩 [analyze_data_node] Analyzing data...");
    const res = await runTool(AdminQaSqlTool as DynamicStructuredTool, {
      question: state.question,
    });

    if (!res || (typeof res === "string" && res.startsWith("Lỗi"))) {
      return {
        errorAnalyzeData: {
          status: 500,
          message:
            typeof res === "string" ? res : "Không thể truy vấn dữ liệu.",
          node: "analyze_data_node",
        },
        nextNodeAnalyzeData: "llm_generate_error_answer_node",
      };
    }

    console.log("✅ [analyze_data_node] Data analyzed successfully.");
    return { result: res, nextNodeAnalyzeData: "generate_chart_config_node" };
  } catch (error: any) {
    console.error("🔥 [analyze_data_node] Error:", error);
    return {
      errorAnalyzeData: {
        status: 500,
        message: error.message,
        node: "analyze_data_node",
      },
      nextNodeAnalyzeData: "llm_generate_error_answer_node",
    };
  }
}

async function generateChartConfigNode(state: typeof CreateReportState.State) {
  try {
    if (!state.result) {
      return {
        errorChartConfig: {
          status: 400,
          message: "Thiếu dữ liệu JSON để sinh cấu hình biểu đồ.",
          node: "generate_chart_config_node",
        },
        nextNodeChartConfig: "llm_generate_error_answer_node",
      };
    }

    console.log("🧩 [generate_chart_config_node] Generating chart config...");
    const res = await runTool(
      GenerateChartConfigTool as DynamicStructuredTool,
      {
        question: state.question,
        data_json: state.result,
      }
    );

    if (!res) {
      return {
        errorChartConfig: {
          status: 404,
          message: "Không thể sinh cấu hình biểu đồ phù hợp.",
          node: "generate_chart_config_node",
        },
        nextNodeChartConfig: "generate_content_node",
      };
    }

    console.log("✅ [generate_chart_config_node] Chart config created.");
    return { chartConfig: res, nextNodeChartConfig: "generate_content_node" };
  } catch (error: any) {
    console.error("🔥 [generate_chart_config_node] Error:", error);
    return {
      errorChartConfig: {
        status: 500,
        message: error.message,
        node: "generate_chart_config_node",
      },
      nextNodeChartConfig: "llm_generate_error_answer_node",
    };
  }
}

async function generateContentNode(state: typeof CreateReportState.State) {
  try {
    if (!state.result) {
      return {
        errorReport: {
          status: 400,
          message: "Thiếu dữ liệu JSON để sinh nội dung báo cáo.",
          node: "generate_content_node",
        },
        nextNodeReport: "llm_generate_error_answer_node",
      };
    }

    console.log("🧩 [generate_content_node] Generating professional report...");
    const res = await runTool(
      WriteProfessionalReportTool as DynamicStructuredTool,
      {
        question: state.question,
        data_json: state.result,
      }
    );

    if (!res) {
      return {
        errorReport: {
          status: 404,
          message: "Không thể sinh nội dung báo cáo từ dữ liệu hiện có.",
          node: "generate_content_node",
        },
        nextNodeReport: "llm_generate_error_answer_node",
      };
    }

    console.log("✅ [generate_content_node] Report generated.");
    return { report: res, nextNodeReport: "create_file_pdf_node" };
  } catch (error: any) {
    console.error("🔥 [generate_content_node] Error:", error);
    return {
      errorReport: {
        status: 500,
        message: error.message,
        node: "generate_content_node",
      },
      nextNodeReport: "llm_generate_error_answer_node",
    };
  }
}

async function CreateFilePdfNode(state: typeof CreateReportState.State) {
  try {
    if (!state.chartConfig || !state.report) {
      return {
        errorPdf: {
          status: 400,
          message: "Thiếu dữ liệu biểu đồ hoặc báo cáo để tạo file PDF.",
          node: "create_file_pdf_node",
        },
        nextNodePdf: "llm_generate_error_answer_node",
      };
    }

    const outputPathImage = await renderChartToImage(state.chartConfig);

    const { url } = await generatePdfReport(state.report, outputPathImage);

    return {
      pdf_url: url,
      nextNodePdf: "__end__",
      final_result: {
        status: 200,
        success: true,
        message: "Không phát hiện lỗi nào, quá trình tạo báo cáo thành công.",
      },
    };
  } catch (error: any) {
    console.error("🔥 [create_file_pdf_node] Error:", error);
    return {
      errorPdf: {
        status: 500,
        message: error.message,
        node: "create_file_pdf_node",
      },
      nextNodePdf: "llm_generate_error_answer_node",
    };
  }
}

const workflow = new StateGraph(CreateReportState)
  .addNode("analyze_data_node", analyzeDataNode)
  .addNode("generate_chart_config_node", generateChartConfigNode)
  .addNode("generate_content_node", generateContentNode)
  .addNode("create_file_pdf_node", CreateFilePdfNode)
  .addNode("llm_generate_error_answer_node", LLMGenerateErrorAnswerNode)

  .addEdge("__start__", "analyze_data_node")

  .addConditionalEdges(
    "analyze_data_node",
    (state) => state.nextNodeAnalyzeData || "__end__"
  )
  .addConditionalEdges(
    "generate_chart_config_node",
    (state) => state.nextNodeChartConfig || "__end__"
  )
  .addConditionalEdges(
    "generate_content_node",
    (state) => state.nextNodeReport || "__end__"
  )

  .addConditionalEdges(
    "create_file_pdf_node",
    (state) => state.nextNodePdf || "__end__"
  )

  .addEdge("llm_generate_error_answer_node", "__end__");

const createReportGraph = workflow.compile();

export default createReportGraph;
