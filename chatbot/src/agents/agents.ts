import * as dotenv from "dotenv";

import { getChatModel } from "../configs/llm.js";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ragTool } from "../tools/rag.tool.js";
import { qaSqlTool } from "../tools/qa_sql.tool.js";
import { medicalConsultationTool } from "../tools/medical_consultation.tool.js";
import { bookingAppointmentTool } from "../tools/booking_appointment.tool.js";

dotenv.config();

const tools = [
  ragTool,
  qaSqlTool,
  medicalConsultationTool,
  bookingAppointmentTool,
];
const toolNode = new ToolNode(tools);

const llm = getChatModel({ temperature: 0.3 }).bindTools(tools);

/**
 * Chính sách sản phẩm cho outer agent — áp dụng trực tiếp cho MỌI câu trả
 * lời (không phụ thuộc việc model có chọn gọi medical_consultation_tool hay
 * không), vì agent có thể tự trả lời câu hỏi y tế mà không qua tool nào.
 */
const AGENT_SYSTEM_PROMPT = `Bạn là trợ lý ảo của LifeHealth, một nền tảng đặt lịch khám bệnh.

Nguyên tắc bắt buộc:
- Ưu tiên sử dụng các công cụ sẵn có (RAG, SQL, đặt lịch, tư vấn y tế) thay vì tự suy đoán thông tin nội bộ hoặc y khoa.
- Không đưa ra chẩn đoán chắc chắn, không thay thế bác sĩ, không tự ý đề nghị thay đổi hoặc ngưng thuốc đã được kê đơn.
- Nếu người dùng mô tả dấu hiệu khẩn cấp (đau ngực dữ dội, khó thở nghiêm trọng, dấu hiệu đột quỵ, quá liều, ý định tự tử/tự hại, chảy máu nghiêm trọng, sốc phản vệ...), phải khuyến nghị gọi cấp cứu (115 tại Việt Nam) hoặc đến cơ sở y tế gần nhất ngay lập tức trước khi trả lời nội dung khác.
- Luôn trả lời theo đúng ngôn ngữ của người dùng.`;

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

// Đo thời gian tạm thời — pipeline chat "agent" có thể lặp lại agent↔tools
// nhiều lượt cho MỘT tin nhắn, mỗi lượt agent là 1 lần gọi LLM thật sự (qua
// createRetryingFetch, ngân sách retry tới 60s/lượt). Log số lượt + thời
// gian mỗi lượt để biết pipeline có đang gọi LLM/tool nhiều hơn cần thiết
// (vd. với 1 câu chào đơn giản) hay 1 lượt LLM tự nó đã chậm.
let callModelInvocationCount = 0;

async function callModel(state: typeof MessagesAnnotation.State) {
  callModelInvocationCount += 1;
  const invocation = callModelInvocationCount;
  const startedAt = Date.now();
  const response = await llm.invoke([
    new SystemMessage(AGENT_SYSTEM_PROMPT),
    ...state.messages,
  ]);
  console.log(
    JSON.stringify({
      scope: "chatbot_agent_timing",
      node: "agent",
      invocation,
      durationMs: Date.now() - startedAt,
      hasToolCalls: Boolean((response as AIMessage).tool_calls?.length),
      toolCallNames: (response as AIMessage).tool_calls?.map((tc) => tc.name),
    }),
  );

  return { messages: [response] };
}

async function callTools(state: typeof MessagesAnnotation.State) {
  const startedAt = Date.now();
  const result = await toolNode.invoke(state);
  console.log(
    JSON.stringify({
      scope: "chatbot_agent_timing",
      node: "tools",
      durationMs: Date.now() - startedAt,
    }),
  );
  return result;
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", callTools)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

const agent = workflow.compile();

export default agent;
