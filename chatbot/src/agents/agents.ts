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

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await llm.invoke([
    new SystemMessage(AGENT_SYSTEM_PROMPT),
    ...state.messages,
  ]);

  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

const agent = workflow.compile();

export default agent;
