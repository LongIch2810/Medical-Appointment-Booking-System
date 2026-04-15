import { Annotation, StateGraph } from "@langchain/langgraph";
import {
  GetHealthProfileTool,
  HealthProfile,
} from "../tools/get_health_profile.tool.js";
import { z } from "zod";
import {
  HealthMetricAnalyzerTool,
  HealthMetricSchema,
} from "../tools/health_metric_analyzer.too.js";
import {
  HealthMetricProgressTool,
  ProgressDataSchema,
} from "../tools/health_metric_progress.tool.js";
import {
  ChartSchema,
  GenerateChartConfigTool,
} from "../tools/generate_chat_config.tool.js";
import {
  HealthPlanGeneratorTool,
  HealthPlanSchema,
} from "../tools/health_plan_generator.tool.js";
import {
  HealthRoadmapReportSchema,
  WriteHealthRoadmapTool,
} from "../tools/write_health_roadmap.tool.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { renderChartToImage } from "../utils/renderChartToImage.js";
import { generatePdfHealthRoadmap } from "../utils/generatePdfHealthRoadmap.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

type HealthMetric = z.infer<typeof HealthMetricSchema>;
type ProgressData = z.infer<typeof ProgressDataSchema>;
type Chart = z.infer<typeof ChartSchema>;
type HealthPlan = z.infer<typeof HealthPlanSchema>;
type HealthRoadmapReport = z.infer<typeof HealthRoadmapReportSchema>;

const HealthRoadMapState = Annotation.Root({
  relative_id: Annotation<number>(),
  token: Annotation<string>(),
  health_profile: Annotation<HealthProfile>(),
  health_metric: Annotation<HealthMetric>(),
  progress_data: Annotation<ProgressData>(),
  chartConfig: Annotation<Chart>(),
  health_plan: Annotation<HealthPlan>(),
  health_roadmap_report: Annotation<HealthRoadmapReport>(),
  pdf_url: Annotation<string>(),
  errorHealthProfile: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeHealthProfile: Annotation<string>(),

  errorHealthMetric: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeHealthMetric: Annotation<string>(),

  errorProgressData: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeProgressData: Annotation<string>(),

  errorChartConfig: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeChartConfig: Annotation<string>(),

  errorPdf: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodePdf: Annotation<string>(),

  errorHealthPlan: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeHealthPlan: Annotation<string>(),

  errorHealthRoadmapReport: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeHealthRoadmapReport: Annotation<string>(),

  final_result: Annotation<{
    status: number;
    success: boolean;
    message: string;
  }>(),

  merged_data: Annotation<any>(),
  nextNodeMergedData: Annotation<string>(),
});

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>
) {
  const result = await tool.invoke(args);
  return result;
}

async function LLMGenerateErrorAnswerNode(
  state: typeof HealthRoadMapState.State
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
      state.errorHealthProfile,
      state.errorChartConfig,
      state.errorHealthMetric,
      state.errorHealthRoadmapReport,
      state.errorProgressData,
      state.errorHealthPlan,
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
        success: false,
        status: res.status,
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

async function GetHealthProfileNode(state: typeof HealthRoadMapState.State) {
  try {
    if (!state.relative_id || !state.token) {
      return {
        errorHealthProfile: {
          status: 400,
          message: "Thiếu thông tin xác thực hoặc ID người thân.",
          node: "health_profile_node",
        },
        nextNodeHealthProfile: "llm_generate_error_answer_node",
      };
    }
    const res = await runTool(GetHealthProfileTool as DynamicStructuredTool, {
      relative_id: state.relative_id,
      token: state.token,
    });

    if (typeof res === "string") {
      return {
        errorHealthProfile: {
          status: 500,
          message: res,
          node: "health_profile_node",
        },
        nextNodeHealthProfile: "llm_generate_error_answer_node",
      };
    }
    return {
      health_profile: res,
      nextNodeHealthProfile: "analyze_health_metric_node",
    };
  } catch (error: any) {
    let message = "Lỗi không xác định khi lấy hồ sơ sức khỏe.";
    if (error.isAxiosError) {
      message =
        error.response?.data?.message || `Lỗi kết nối API: ${error.message}`;
    } else if (error.message) {
      message = error.message;
    }

    return {
      errorHealthProfile: {
        status: 500,
        message,
        node: "health_profile_node",
      },
      nextNodeHealthProfile: "llm_generate_error_answer_node",
    };
  }
}

async function AnalyzeHealthMetricNode(state: typeof HealthRoadMapState.State) {
  try {
    const health_profile_json = JSON.stringify(state.health_profile);
    const res = await runTool(
      HealthMetricAnalyzerTool as DynamicStructuredTool,
      { health_profile_json }
    );

    if (!res) {
      return {
        errorHealthMetric: {
          status: 500,
          message: "Phân tích chỉ số sức khỏe thất bại.",
          node: "analyze_health_metric_node",
        },
        nextNodeHealthMetric: "llm_generate_error_answer_node",
      };
    }

    return {
      health_metric: res,
      nextNodeHealthMetric: "parallel_node",
    };
  } catch (error: any) {
    return {
      errorHealthMetric: {
        status: 500,
        message: error.message,
        node: "analyze_health_metric_node",
      },
      nextNodeHealthMetric: "llm_generate_error_answer_node",
    };
  }
}

async function HealthMetricProgressNode(
  state: typeof HealthRoadMapState.State
) {
  try {
    const res = await runTool(
      HealthMetricProgressTool as DynamicStructuredTool,
      {
        health_metric_analyzer_json: JSON.stringify(state.health_metric),
      }
    );

    if (!res) {
      return {
        errorProgressData: {
          status: 404,
          message: "Không tạo được dữ liệu tiến trình sức khỏe.",
          node: "health_metric_progress_node",
        },
        nextNodeProgressData: "llm_generate_error_answer_node",
      };
    }

    return {
      progress_data: res,
      nextNodeProgressData: "generate_chart_config_node",
    };
  } catch (error: any) {
    return {
      errorProgressData: {
        status: 500,
        message: error.message,
        node: "health_metric_progress_node",
      },
      nextNodeProgressData: "llm_generate_error_answer_node",
    };
  }
}

async function GenerateChartConfigNode(state: typeof HealthRoadMapState.State) {
  try {
    const res = await runTool(
      GenerateChartConfigTool as DynamicStructuredTool,
      {
        question: `Lộ trình cải thiện sức khỏe ${
          state.health_metric?.expectedImprovement?.duration_months || "?"
        } tháng`,
        data_json: JSON.stringify(state.progress_data),
      }
    );

    if (!res) {
      return {
        errorChartConfig: {
          status: 404,
          message: "Không thể sinh cấu hình biểu đồ.",
          node: "generate_chart_config_node",
        },
        nextNodeChartConfig: "llm_generate_error_answer_node",
      };
    }

    return {
      chartConfig: res,
      nextNodeChartConfig: "merged_node",
    };
  } catch (error: any) {
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

async function GenerateHealthPlanNode(state: typeof HealthRoadMapState.State) {
  try {
    const res = await runTool(
      HealthPlanGeneratorTool as DynamicStructuredTool,
      {
        health_metric_analyzer_json: JSON.stringify(state.health_metric),
      }
    );

    if (!res) {
      return {
        errorHealthPlan: {
          status: 404,
          message: "Không thể sinh kế hoạch cải thiện sức khỏe.",
          node: "generate_health_plan_node",
        },
        nextNodeHealthPlan: "llm_generate_error_answer_node",
      };
    }

    return {
      health_plan: res,
      nextNodeHealthPlan: "write_health_roadmap_report_node",
    };
  } catch (error: any) {
    return {
      errorHealthPlan: {
        status: 500,
        message: error.message,
        node: "generate_health_plan_node",
      },
      nextNodeHealthPlan: "llm_generate_error_answer_node",
    };
  }
}

async function WriteHealthRoadmapReportNode(
  state: typeof HealthRoadMapState.State
) {
  try {
    const res = await runTool(WriteHealthRoadmapTool as DynamicStructuredTool, {
      data_json: JSON.stringify(state.health_plan),
    });

    if (!res) {
      return {
        errorHealthRoadmapReport: {
          status: 404,
          message: "Không thể sinh báo cáo lộ trình sức khỏe.",
          node: "write_health_roadmap_report_node",
        },
        nextNodeHealthRoadmapReport: "llm_generate_error_answer_node",
      };
    }

    return {
      health_roadmap_report: res,
      nextNodeHealthRoadmapReport: "merged_node",
    };
  } catch (error: any) {
    return {
      errorHealthRoadmapReport: {
        status: 500,
        message: error.message,
        node: "write_health_roadmap_report_node",
      },
      nextNodeHealthRoadmapReport: "llm_generate_error_answer_node",
    };
  }
}

async function MergedNode(state: typeof HealthRoadMapState.State) {
  const merged_data = {
    health_profile: state.health_profile,
    health_metric: state.health_metric,
    progress_data: state.progress_data,
    chartConfig: state.chartConfig,
    health_plan: state.health_plan,
    health_roadmap_report: state.health_roadmap_report,
  };

  return { merged_data, nextNodeMergedData: "create_file_pdf_node" };
}

async function CreateFilePdfNode(state: typeof HealthRoadMapState.State) {
  try {
    const outputPathImage = await renderChartToImage(
      state.merged_data.chartConfig
    );
    const { url } = await generatePdfHealthRoadmap(
      state.merged_data.health_roadmap_report,
      outputPathImage
    );

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

const workflow = new StateGraph(HealthRoadMapState)
  .addNode("get_health_profile_node", GetHealthProfileNode)
  .addNode("analyze_health_metric_node", AnalyzeHealthMetricNode)
  .addNode("health_metric_progress_node", HealthMetricProgressNode)
  .addNode("generate_chart_config_node", GenerateChartConfigNode)
  .addNode("generate_health_plan_node", GenerateHealthPlanNode)
  .addNode("write_health_roadmap_report_node", WriteHealthRoadmapReportNode)
  .addNode("create_file_pdf_node", CreateFilePdfNode)
  .addNode("llm_generate_error_answer_node", LLMGenerateErrorAnswerNode)
  .addNode("parallel_node", () => ({}))
  .addNode("merged_node", MergedNode)

  .addEdge("__start__", "get_health_profile_node")

  .addConditionalEdges(
    "get_health_profile_node",
    (s) => s.nextNodeHealthProfile || "__end__"
  )

  .addConditionalEdges("analyze_health_metric_node", (state) => {
    return state.nextNodeHealthMetric || "__end__";
  })

  .addEdge("parallel_node", "health_metric_progress_node")
  .addEdge("parallel_node", "generate_health_plan_node")

  .addConditionalEdges(
    "health_metric_progress_node",
    (s) => s.nextNodeProgressData || "__end__"
  )

  .addConditionalEdges(
    "generate_chart_config_node",
    (s) => s.nextNodeChartConfig || "__end__"
  )
  .addConditionalEdges(
    "generate_health_plan_node",
    (s) => s.nextNodeHealthPlan || "__end__"
  )
  .addConditionalEdges(
    "write_health_roadmap_report_node",
    (s) => s.nextNodeHealthRoadmapReport || "__end__"
  )
  .addConditionalEdges("merged_node", (state) => {
    return state.nextNodeMergedData || "__end__";
  })
  .addConditionalEdges(
    "create_file_pdf_node",
    (s) => s.nextNodePdf || "__end__"
  )

  .addEdge("llm_generate_error_answer_node", "__end__");

const buildHealthRoadmapGraph = workflow.compile();

export default buildHealthRoadmapGraph;
