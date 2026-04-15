import * as dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { AnalyzeSymptomsTool } from "../tools/symptoms_analyzer.tool.js";
import { DiagnosisTool } from "../tools/diagnosis.tool.js";
import { ClinicalSuggestionTool } from "../tools/clinical_suggestion.tool.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GetHealthProfileTool } from "../tools/get_health_profile.tool.js";
import { z } from "zod";
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

const AiDiagnosisState = Annotation.Root({
  text_input: Annotation<string>(),
  token: Annotation<string>(),
  relative_id: Annotation<number>(),
  health_profile: Annotation<{
    fullname: string;
    gender: string;
    weight: string;
    blood_type: string;
    medical_history: string;
    allergies: string;
    heart_rate: string;
    blood_pressure: string;
    glucose_level: string;
    cholesterol_level: string;
    medications: string;
    vaccinations: string;
    smoking: string;
    alcohol_consumption: string;
    exercise_frequency: string;
    last_checkup_date: string;
  }>(),
  symptoms: Annotation<
    {
      id: number;
      symptoms_name: string;
    }[]
  >(),
  diagnosis: Annotation<
    {
      id: number;
      name: string;
      probability: number;
    }[]
  >(),
  suggestion: Annotation<{
    summary: string;
    analysis: {
      disease: string;
      reason: string;
      recommendations: string[];
    }[];
  }>(),
  errorInput: Annotation<{
    status: number;
    message: string;
    node: string;
  }>(),
  nextNodeInput: Annotation<string>(),
  errorHealthProfile: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeHealthProfile: Annotation<string>(),
  errorSymptoms: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeSymptoms: Annotation<string>(),
  errorDiagnosis: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeDiagnosis: Annotation<string>(),
  errorSuggestion: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeSuggestion: Annotation<string>(),
  errorLlmAnswer: Annotation<{
    status: number;
    message: string;
    node: string;
  } | null>(),
  nextNodeLlmAnswer: Annotation<string>(),
  final_result: Annotation<{
    status: number;
    success: boolean;
    message: string;
  }>(),
  merged_data: Annotation<any>(),
  nextNodeMergedData: Annotation<string>(),
  answer: Annotation<string>(),
});

async function runTool<T extends DynamicStructuredTool>(
  tool: T,
  args: Record<string, any>
) {
  const result = await tool.invoke(args);
  return result;
}

async function LLMGenerateErrorAnswerNode(
  state: typeof AiDiagnosisState.State
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
      state.errorSymptoms,
      state.errorDiagnosis,
      state.errorSuggestion,
      state.errorLlmAnswer,
      state.errorInput,
    ].filter(Boolean);

    if (errors.length === 0) {
      return {
        final_result: {
          status: 200,
          success: true,
          message: "Không phát hiện lỗi nào, quá trình chuẩn đoán thành công.",
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

async function InputNode(state: typeof AiDiagnosisState.State) {
  if (
    !state.text_input ||
    state.text_input.trim().length < 3 ||
    !state.token ||
    !state.relative_id
  ) {
    return {
      errorInput: {
        status: 400,
        message:
          "Dữ liệu đầu vào không hợp lệ. Hãy nhập triệu chứng hợp lệ và đảm bảo đã đăng nhập.",
        node: "input_node",
      },
      nextNodeInput: "llm_generate_error_answer_node",
    };
  }

  return {
    nextNodeInput: "parallel_node",
  };
}

async function GetHealthProfileNode(state: typeof AiDiagnosisState.State) {
  try {
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
      nextNodeHealthProfile: "merged_node",
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

async function AnalyzeSymptomsNode(state: typeof AiDiagnosisState.State) {
  try {
    const res = await runTool(AnalyzeSymptomsTool as DynamicStructuredTool, {
      text_input: state.text_input,
    });

    if (!res || res.length === 0) {
      return {
        errorSymptoms: {
          status: 404,
          message: "Không phân tích được triệu chứng nào từ mô tả người dùng.",
          node: "analyze_symptoms_node",
        },
        nextNodeSymptoms: "llm_generate_error_answer_node",
      };
    }

    console.log("[Node] analyze_symptoms — output:", res);
    return { symptoms: res, nextNodeSymptoms: "diagnosis_node" };
  } catch (error: any) {
    return {
      errorSymptoms: {
        status: 500,
        message: error.message,
        node: "analyze_symptoms_node",
      },
      nextNodeSymptoms: "llm_generate_error_answer_node",
    };
  }
}

async function DiagnosisNode(state: typeof AiDiagnosisState.State) {
  try {
    if (!state.symptoms || state.symptoms.length === 0) {
      return {
        errorDiagnosis: {
          status: 400,
          message: "Không có dữ liệu triệu chứng để chẩn đoán.",
          node: "diagnosis_node",
        },
        nextNodeDiagnosis: "llm_generate_error_answer_node",
      };
    }

    const res = await runTool(DiagnosisTool as DynamicStructuredTool, {
      symptoms: state.symptoms,
    });

    if (!res || res.length === 0) {
      return {
        errorDiagnosis: {
          status: 404,
          message: "Không thể xác định được bệnh khả dĩ.",
          node: "diagnosis_node",
        },
        nextNodeDiagnosis: "llm_generate_error_answer_node",
      };
    }

    return { diagnosis: res, nextNodeDiagnosis: "suggestion_node" };
  } catch (error: any) {
    return {
      errorDiagnosis: {
        status: 500,
        message: error.message,
        node: "diagnosis_node",
      },
      nextNodeDiagnosis: "llm_generate_error_answer_node",
    };
  }
}

async function SuggestionNode(state: typeof AiDiagnosisState.State) {
  try {
    if (!state.diagnosis || state.diagnosis.length === 0) {
      return {
        errorSuggestion: {
          status: 400,
          message: "Không có dữ liệu chẩn đoán để đưa ra gợi ý điều trị.",
          node: "suggestion_node",
        },
        nextNodeSuggestion: "llm_generate_error_answer_node",
      };
    }

    const res = await runTool(ClinicalSuggestionTool as DynamicStructuredTool, {
      diagnosis: state.diagnosis,
    });

    if (!res) {
      return {
        errorSuggestion: {
          status: 404,
          message: "Không có gợi ý điều trị phù hợp.",
          node: "suggestion_node",
        },
        nextNodeSuggestion: "llm_generate_error_answer_node",
      };
    }

    return { suggestion: res, nextNodeSuggestion: "merged_node" };
  } catch (error: any) {
    return {
      errorSuggestion: {
        status: 500,
        message: error.message,
        node: "suggestion_node",
      },
      nextNodeSuggestion: "llm_generate_error_answer_node",
    };
  }
}

async function MergedNode(state: typeof AiDiagnosisState.State) {
  const merged_data = {
    health_profile: state.health_profile,
    symptoms: state.symptoms,
    diagnosis: state.diagnosis,
    suggestion: state.suggestion,
  };

  return { merged_data, nextNodeMergedData: "llm_answer_node" };
}

export async function LlmAnswerNode(state: typeof AiDiagnosisState.State) {
  try {
    const systemPrompt = `
  Bạn là một **trợ lý y khoa chuyên nghiệp**, có nhiệm vụ tổng hợp toàn bộ thông tin bệnh nhân
  và đưa ra **báo cáo chẩn đoán tổng quát** cho bác sĩ hoặc bệnh nhân.
  
  Hãy đọc dữ liệu JSON dưới đây, bao gồm:
  - Hồ sơ sức khỏe (health_profile)
  - Triệu chứng (symptoms)
  - Chẩn đoán AI (diagnosis)
  - Gợi ý chuyên môn cho bác sĩ (suggestion)
  - Các thông tin khác có trong state (nếu có)
  
  Nhiệm vụ của bạn:
  1. Tóm tắt hồ sơ bệnh nhân: tên, tuổi, giới tính, cân nặng, nhóm máu, tiền sử bệnh, dị ứng, thói quen sinh hoạt.
  2. Mô tả triệu chứng mà bệnh nhân đang gặp phải.
  3. Trình bày chẩn đoán khả dĩ nhất kèm xác suất (nếu có nhiều bệnh, liệt kê theo xác suất giảm dần).
  4. Giải thích lý do chẩn đoán dựa trên triệu chứng.
  5. Trình bày các gợi ý chuyên môn / hướng điều trị sơ bộ dựa vào các bệnh đã chuẩn đoán và liệt kê rõ ràng gợi ý hoặc hướng điều trị của bệnh nào.
  6. Tổng kết và khuyến nghị tiếp theo: ví dụ nên đi khám chuyên khoa nào, cần xét nghiệm gì, hay chỉ cần theo dõi.
  
  Yêu cầu:
  - Viết bằng tiếng Việt, giọng văn y khoa chuyên nghiệp, dễ hiểu.
  - Tránh từ ngữ khẳng định tuyệt đối như “bạn chắc chắn mắc bệnh...”.
  - Chỉ mang tính chất hỗ trợ chẩn đoán, không thay thế ý kiến bác sĩ.
  
  Định dạng đầu ra (markdown đẹp, rõ ràng):
    Báo cáo chẩn đoán AI
     1. Hồ sơ bệnh nhân
     2. Triệu chứng hiện tại
     3. Chẩn đoán khả dĩ
     4. Phân tích và lý do
     5. Gợi ý chuyên môn
     6. Kết luận và khuyến nghị
  `;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      [
        "human",
        "Dưới đây là toàn bộ dữ liệu chẩn đoán AI của bệnh nhân:\n\n{aiDiagnosis_json}",
      ],
    ]);

    const pipeline = promptTemplate.pipe(llm);

    const res = await pipeline.invoke({
      aiDiagnosis_json: JSON.stringify(state.merged_data, null, 2),
    });

    return {
      answer: res.content,
      nextNodeLlmAnswer: "__end__",
      final_result: {
        status: 200,
        success: true,
        message: "Không phát hiện lỗi nào, quá trình chuẩn đoán thành công.",
      },
    };
  } catch (error: any) {
    return {
      errorLlmAnswer: {
        status: 500,
        message: error.message,
        node: "llm_answer_node",
      },
      nextNodeLlmAnswer: "llm_generate_error_answer_node",
    };
  }
}

const workflow = new StateGraph(AiDiagnosisState)
  .addNode("input_node", InputNode)
  .addNode("health_profile_node", GetHealthProfileNode)
  .addNode("analyze_symptoms_node", AnalyzeSymptomsNode)
  .addNode("diagnosis_node", DiagnosisNode)
  .addNode("suggestion_node", SuggestionNode)
  .addNode("merged_node", MergedNode)
  .addNode("llm_answer_node", LlmAnswerNode)
  .addNode("llm_generate_error_answer_node", LLMGenerateErrorAnswerNode)
  .addNode("parallel_node", () => ({}))

  .addEdge("__start__", "input_node")

  .addConditionalEdges("input_node", (state) => {
    return state.nextNodeInput || "__end__";
  })

  .addEdge("parallel_node", "health_profile_node")
  .addEdge("parallel_node", "analyze_symptoms_node")

  .addConditionalEdges("analyze_symptoms_node", (state) => {
    return state.nextNodeSymptoms || "__end__";
  })
  .addConditionalEdges("diagnosis_node", (state) => {
    return state.nextNodeDiagnosis || "__end__";
  })
  .addConditionalEdges("suggestion_node", (state) => {
    return state.nextNodeSuggestion || "__end__";
  })

  .addConditionalEdges("health_profile_node", (state) => {
    return state.nextNodeHealthProfile || "__end__";
  })

  .addConditionalEdges("merged_node", (state) => {
    return state.nextNodeMergedData || "__end__";
  })

  .addConditionalEdges("llm_answer_node", (state) => {
    return state.nextNodeLlmAnswer || "__end__";
  })

  .addEdge("llm_generate_error_answer_node", "__end__");

const diagnosisGraph = workflow.compile();

export default diagnosisGraph;
