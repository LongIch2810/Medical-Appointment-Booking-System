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
import { getChatModel } from "../configs/llm.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { logSafeError } from "../utils/safeLog.js";
import { assertNumericGrounding } from "../utils/validateNumericGrounding.js";

type ChartConfig = z.infer<typeof ChartSchema>;
type Report = z.infer<typeof ReportSchema>;

const CreateReportState = Annotation.Root({
  question: Annotation<string>(),
  preferredChartType: Annotation<"BAR" | "LINE" | "PIE" | undefined>(),
  detailLevel: Annotation<"BRIEF" | "STANDARD" | "DETAILED" | undefined>(),
  result: Annotation<string>(),
  chartConfig: Annotation<ChartConfig>(),
  report: Annotation<Report>(),
  file_name: Annotation<string | undefined>(),
  pdf_asset: Annotation<any>(),
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
    code?: string;
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

// retries: LLM proxy nội bộ đôi khi không gọi function trong lượt
// withStructuredOutput (model trả lời rỗng, không phải lỗi cứng) — đã khảo
// sát thực nghiệm: cùng input, tỉ lệ thành công ~1/3 mỗi lượt gọi. Thử lại
// vài lần trước khi coi là thất bại thật sự để tránh báo lỗi oan.
async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>,
  retries = 4,
) {
  let result: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    result = await tool.invoke(args);
    if (result) return result;
    console.warn(
      `⚠️ [runTool] ${tool.name} trả về rỗng, thử lại (${attempt + 1}/${retries + 1})...`,
    );
  }
  return result;
}

async function LLMGenerateErrorAnswerNode(
  state: typeof CreateReportState.State,
) {
  try {
    const errorSchema = z.object({
      status: z
        .number()
        .describe("Mã trạng thái HTTP mô phỏng lỗi (ví dụ 400, 404, 500)."),
      error_detail: z
        .string()
        .describe(
          "Thông điệp lỗi thân thiện và dễ hiểu dành cho người dùng cuối, bằng tiếng Việt.",
        ),
    });
    const errors = [
      state.errorAnalyzeData,
      state.errorChartConfig,
      state.errorReport,
      state.errorPdf,
    ].filter(Boolean);

    if (errors.some((error: any) => error?.code === "REPORT_NUMERIC_GROUNDING_FAILED")) {
      return {
        final_result: {
          status: 422,
          success: false,
          code: "REPORT_NUMERIC_GROUNDING_FAILED",
          message: "Không thể hoàn tất báo cáo vì AI đưa ra số liệu chưa được dữ liệu truy vấn xác nhận. Vui lòng thử diễn đạt lại yêu cầu.",
        },
      };
    }

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
    const llm = getChatModel({ profile: "fast", temperature: 0.3 });
    // method: "functionCalling" — xem giải thích ở generate_chat_config.tool.ts.
    const structuredModel = llm.withStructuredOutput(errorSchema, {
      method: "functionCalling",
    });

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

// PostgreSQL trả numeric/bigint qua node-postgres dưới dạng chuỗi (giữ độ
// chính xác), nên QuerySqlTool serialize JSON ra các field như
// "total_appointments": "4" thay vì số thật. Đã khảo sát thực nghiệm: dữ
// liệu numeric-dạng-chuỗi khiến LLM proxy nội bộ gần như không bao giờ gọi
// được function trong withStructuredOutput (tỉ lệ thành công ~0%), trong
// khi cùng dữ liệu với số thật (JS number) thành công ổn định — nên chuẩn
// hoá lại chuỗi số về số thật trước khi đưa cho các bước LLM tiếp theo.
function normalizeNumericStrings(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;
    const normalizeValue = (value: unknown): unknown => {
      if (typeof value === "string" && NUMERIC_STRING.test(value)) {
        return Number(value);
      }
      if (Array.isArray(value)) return value.map(normalizeValue);
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, normalizeValue(v)]),
        );
      }
      return value;
    };
    return JSON.stringify(normalizeValue(parsed));
  } catch {
    return jsonString;
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

    const normalizedResult =
      typeof res === "string" ? normalizeNumericStrings(res) : res;
    return {
      result: normalizedResult,
      nextNodeAnalyzeData: "generate_chart_config_node",
    };
  } catch (error: any) {
    logSafeError("[analyze_data_node] failed", error);
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

    const res = await runTool(
      GenerateChartConfigTool as DynamicStructuredTool,
      {
        question: state.question,
        data_json: state.result,
        ...(state.preferredChartType
          ? { preferredChartType: state.preferredChartType }
          : {}),
      },
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

    return { chartConfig: res, nextNodeChartConfig: "generate_content_node" };
  } catch (error: any) {
    logSafeError("[generate_chart_config_node] failed", error);
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

    let res: Report | undefined;
    let groundingError = false;
    for (let attempt = 0; attempt <= 4; attempt++) {
      res = await WriteProfessionalReportTool.invoke({
        question: state.question,
        data_json: state.result,
        ...(state.detailLevel ? { detailLevel: state.detailLevel } : {}),
      });
      if (!res) continue;
      try {
        assertNumericGrounding(res, state.result);
        break;
      } catch {
        groundingError = true;
        res = undefined;
      }
    }

    if (!res) {
      return {
        errorReport: {
          status: groundingError ? 422 : 404,
          code: groundingError ? "REPORT_NUMERIC_GROUNDING_FAILED" : undefined,
          message: groundingError
            ? "Nội dung AI chứa số liệu không được kết quả truy vấn hỗ trợ."
            : "Không thể sinh nội dung báo cáo từ dữ liệu hiện có.",
          node: "generate_content_node",
        },
        nextNodeReport: "llm_generate_error_answer_node",
      };
    }

    return { report: res, nextNodeReport: "create_file_pdf_node" };
  } catch (error: any) {
    logSafeError("[generate_content_node] failed", error);
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

    const asset = await generatePdfReport(
      state.report,
      outputPathImage,
      state.file_name,
    );

    return {
      pdf_asset: asset,
      pdf_url: (asset as any)?.url,
      nextNodePdf: "__end__",
      final_result: {
        status: 200,
        success: true,
        message: "Không phát hiện lỗi nào, quá trình tạo báo cáo thành công.",
      },
    };
  } catch (error: any) {
    logSafeError("[create_file_pdf_node] failed", error);
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
    (state) => state.nextNodeAnalyzeData || "__end__",
  )
  .addConditionalEdges(
    "generate_chart_config_node",
    (state) => state.nextNodeChartConfig || "__end__",
  )
  .addConditionalEdges(
    "generate_content_node",
    (state) => state.nextNodeReport || "__end__",
  )

  .addConditionalEdges(
    "create_file_pdf_node",
    (state) => state.nextNodePdf || "__end__",
  )

  .addEdge("llm_generate_error_answer_node", "__end__");

const createReportGraph = workflow.compile();

export async function runReportPipeline(input: {
  question: string;
  fileName?: string;
  preferredChartType?: "BAR" | "LINE" | "PIE";
  detailLevel?: "BRIEF" | "STANDARD" | "DETAILED";
}) {
  return createReportGraph.invoke({
    question: input.question,
    ...(input.preferredChartType
      ? { preferredChartType: input.preferredChartType }
      : {}),
    ...(input.detailLevel ? { detailLevel: input.detailLevel } : {}),
    ...(input.fileName ? { file_name: input.fileName } : {}),
  });
}

export default createReportGraph;
