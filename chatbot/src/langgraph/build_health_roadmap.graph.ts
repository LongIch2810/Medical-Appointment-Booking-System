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
  HealthRoadmapGenerateChartConfigTool,
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
import {
  getHealthRoadmapErrorType,
  getHealthRoadmapFinalError,
  HealthRoadmapNodeError,
  logHealthRoadmapEvent,
  runHealthRoadmapOperation,
  toHealthRoadmapNodeError,
} from "../utils/healthRoadmapRuntime.js";

type HealthMetric = z.infer<typeof HealthMetricSchema>;
type ProgressData = z.infer<typeof ProgressDataSchema>;
type Chart = z.infer<typeof ChartSchema>;
type HealthPlan = z.infer<typeof HealthPlanSchema>;
type HealthRoadmapReport = z.infer<typeof HealthRoadmapReportSchema>;

const HealthRoadMapState = Annotation.Root({
  request_id: Annotation<string>(),
  relative_id: Annotation<number>(),
  token: Annotation<string>(),
  health_profile: Annotation<HealthProfile>(),
  health_metric: Annotation<HealthMetric>(),
  progress_data: Annotation<ProgressData>(),
  chartConfig: Annotation<Chart>(),
  health_plan: Annotation<HealthPlan>(),
  health_roadmap_report: Annotation<HealthRoadmapReport>(),
  pdf_asset: Annotation<any>(),
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
  args: Record<string, any>,
  runtime: {
    requestId: string;
    relativeId: number;
    node: string;
  }
) {
  const startedAt = Date.now();
  logHealthRoadmapEvent({
    requestId: runtime.requestId,
    relativeId: runtime.relativeId,
    node: runtime.node,
    event: "node_started",
  });

  try {
    const result = await runHealthRoadmapOperation(
      () => tool.invoke(args),
      runtime
    );
    logHealthRoadmapEvent({
      requestId: runtime.requestId,
      relativeId: runtime.relativeId,
      node: runtime.node,
      event: "node_succeeded",
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logHealthRoadmapEvent({
      requestId: runtime.requestId,
      relativeId: runtime.relativeId,
      node: runtime.node,
      event: "node_failed",
      durationMs: Date.now() - startedAt,
      errorType: getHealthRoadmapErrorType(error),
    });
    throw error;
  }
}

async function LLMGenerateErrorAnswerNode(
  state: typeof HealthRoadMapState.State
) {
  const errors = [
    state.errorHealthProfile,
    state.errorChartConfig,
    state.errorHealthMetric,
    state.errorHealthRoadmapReport,
    state.errorProgressData,
    state.errorHealthPlan,
    state.errorPdf,
  ].filter((error): error is HealthRoadmapNodeError => Boolean(error));
  const finalResult = getHealthRoadmapFinalError(errors);
  const selectedError =
    errors.find((error) => error.status === finalResult.status) ?? errors[0];

  logHealthRoadmapEvent({
    requestId: state.request_id,
    relativeId: state.relative_id,
    event: "roadmap_failed",
    node: selectedError?.node ?? "unknown",
    status: finalResult.status,
    errorType: finalResult.status === 504 ? "timeout" : "node_error",
  });

  return { final_result: finalResult };
}

function getNodeRuntime(
  state: typeof HealthRoadMapState.State,
  node: string
) {
  return {
    requestId: state.request_id,
    relativeId: state.relative_id,
    node,
  };
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
    const res = await runTool(
      GetHealthProfileTool as DynamicStructuredTool,
      {
        relative_id: state.relative_id,
        token: state.token,
      },
      getNodeRuntime(state, "health_profile_node")
    );

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
  } catch (error: unknown) {
    return {
      errorHealthProfile: toHealthRoadmapNodeError(
        error,
        "health_profile_node",
        "Không thể lấy hồ sơ sức khỏe."
      ),
      nextNodeHealthProfile: "llm_generate_error_answer_node",
    };
  }
}

async function AnalyzeHealthMetricNode(state: typeof HealthRoadMapState.State) {
  try {
    const health_profile_json = JSON.stringify(state.health_profile);
    const res = await runTool(
      HealthMetricAnalyzerTool as DynamicStructuredTool,
      { health_profile_json },
      getNodeRuntime(state, "analyze_health_metric_node")
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
  } catch (error: unknown) {
    return {
      errorHealthMetric: toHealthRoadmapNodeError(
        error,
        "analyze_health_metric_node",
        "Không thể phân tích chỉ số sức khỏe."
      ),
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
      },
      getNodeRuntime(state, "health_metric_progress_node")
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
  } catch (error: unknown) {
    return {
      errorProgressData: toHealthRoadmapNodeError(
        error,
        "health_metric_progress_node",
        "Không thể tạo dữ liệu tiến trình sức khỏe."
      ),
      nextNodeProgressData: "llm_generate_error_answer_node",
    };
  }
}

async function GenerateChartConfigNode(state: typeof HealthRoadMapState.State) {
  try {
    const res = await runTool(
      HealthRoadmapGenerateChartConfigTool as DynamicStructuredTool,
      {
        question: `Lộ trình cải thiện sức khỏe ${
          state.health_metric?.expectedImprovement?.duration_months || "?"
        } tháng`,
        data_json: JSON.stringify(state.progress_data),
      },
      getNodeRuntime(state, "generate_chart_config_node")
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
  } catch (error: unknown) {
    return {
      errorChartConfig: toHealthRoadmapNodeError(
        error,
        "generate_chart_config_node",
        "Không thể tạo cấu hình biểu đồ."
      ),
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
      },
      getNodeRuntime(state, "generate_health_plan_node")
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
  } catch (error: unknown) {
    return {
      errorHealthPlan: toHealthRoadmapNodeError(
        error,
        "generate_health_plan_node",
        "Không thể tạo kế hoạch cải thiện sức khỏe."
      ),
      nextNodeHealthPlan: "llm_generate_error_answer_node",
    };
  }
}

async function WriteHealthRoadmapReportNode(
  state: typeof HealthRoadMapState.State
) {
  try {
    const res = await runTool(
      WriteHealthRoadmapTool as DynamicStructuredTool,
      {
        data_json: JSON.stringify(state.health_plan),
      },
      getNodeRuntime(state, "write_health_roadmap_report_node")
    );

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
  } catch (error: unknown) {
    return {
      errorHealthRoadmapReport: toHealthRoadmapNodeError(
        error,
        "write_health_roadmap_report_node",
        "Không thể viết báo cáo lộ trình sức khỏe."
      ),
      nextNodeHealthRoadmapReport: "llm_generate_error_answer_node",
    };
  }
}

async function MergedNode(state: typeof HealthRoadMapState.State) {
  const errors = [
    state.errorHealthProfile,
    state.errorHealthMetric,
    state.errorProgressData,
    state.errorChartConfig,
    state.errorHealthPlan,
    state.errorHealthRoadmapReport,
    state.errorPdf,
  ].filter(Boolean);

  if (errors.length > 0) {
    return { nextNodeMergedData: "llm_generate_error_answer_node" };
  }

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
  const startedAt = Date.now();
  const runtime = getNodeRuntime(state, "create_file_pdf_node");
  logHealthRoadmapEvent({
    ...runtime,
    event: "node_started",
  });

  try {
    const outputPathImage = await renderChartToImage(
      state.merged_data.chartConfig
    );
    const asset = await generatePdfHealthRoadmap(
      state.merged_data.health_roadmap_report,
      outputPathImage
    );

    if (!asset?.publicId && !(asset as any)?.url) {
      throw new Error("PDF asset was not returned");
    }

    logHealthRoadmapEvent({
      ...runtime,
      event: "node_succeeded",
      durationMs: Date.now() - startedAt,
    });

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
  } catch (error: unknown) {
    logHealthRoadmapEvent({
      ...runtime,
      event: "node_failed",
      durationMs: Date.now() - startedAt,
      errorType: getHealthRoadmapErrorType(error),
    });

    return {
      errorPdf: toHealthRoadmapNodeError(
        error,
        "create_file_pdf_node",
        "Không thể tạo hoặc tải lên tệp PDF."
      ),
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
