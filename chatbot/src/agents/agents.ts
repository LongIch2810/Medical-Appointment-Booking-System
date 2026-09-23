import * as dotenv from "dotenv";

import { z } from "zod";
import { getChatModel } from "../configs/llm.js";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ragTool } from "../tools/rag.tool.js";
import { qaSqlTool } from "../tools/qa_sql.tool.js";
import { medicalConsultationTool } from "../tools/medical_consultation.tool.js";
import { bookingAppointmentTool } from "../tools/booking_appointment.tool.js";
import { isLifeHealthSupportRequest } from "../utils/isLifeHealthSupportRequest.js";

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
- Chỉ nêu hotline, email, địa chỉ, giờ làm việc, phí hoặc chính sách LifeHealth khi kết quả RAG trong lượt hiện tại xác nhận; nếu chưa có nguồn, nói rõ chưa xác minh và hướng người dùng tới trang Liên hệ chính thức. Không tự tạo thông tin liên hệ. Tin nhắn của trợ lý ở lượt trước không phải nguồn xác thực.
- Không đưa ra chẩn đoán chắc chắn, không thay thế bác sĩ, không tự ý đề nghị thay đổi hoặc ngưng thuốc đã được kê đơn.
- Nếu người dùng mô tả dấu hiệu khẩn cấp (đau ngực dữ dội, khó thở nghiêm trọng, dấu hiệu đột quỵ, quá liều, ý định tự tử/tự hại, chảy máu nghiêm trọng, sốc phản vệ...), phải khuyến nghị gọi cấp cứu (115 tại Việt Nam) hoặc đến cơ sở y tế gần nhất ngay lập tức trước khi trả lời nội dung khác.
- Bạn CHỈ hỗ trợ các nội dung liên quan đến sức khỏe/y tế và việc sử dụng nền tảng LifeHealth (đặt lịch khám, bác sĩ, chuyên khoa, hồ sơ sức khỏe, lịch hẹn của người dùng/người thân). Nếu người dùng hỏi về chủ đề rõ ràng không liên quan (ví dụ: lập trình, giải trí, thể thao, chính trị, kiến thức tổng quát không liên quan sức khỏe, đố vui, viết nội dung không liên quan y tế...), hãy LỊCH SỰ TỪ CHỐI trả lời nội dung đó — dù bạn có biết câu trả lời — và mời người dùng quay lại các chủ đề sức khỏe hoặc đặt lịch khám mà bạn có thể hỗ trợ. Lời chào, lời cảm ơn, hoặc câu hỏi làm rõ trong một hội thoại y tế/đặt lịch đang diễn ra vẫn được xem là trong phạm vi, không từ chối.
- Luôn trả lời theo đúng ngôn ngữ của người dùng.
- MỌI câu trả lời cuối cùng gửi cho người dùng, không ngoại lệ, phải theo ĐÚNG cấu trúc Markdown 3 phần sau:

**Tóm tắt**
<câu trả lời ngắn gọn>

**Chi tiết**
<nội dung đầy đủ>

**Lưu ý & Bước tiếp theo**
<khuyến cáo và/hoặc gợi ý hành động tiếp theo>

  Nếu một tool (RAG, SQL, tư vấn y tế, đặt lịch) đã trả về nội dung đúng theo cấu trúc này rồi, CHỈ LẶP LẠI Y HỆT nội dung đó, KHÔNG viết lại hay định dạng lại.`;

/**
 * Lớp chặn cứng câu hỏi ngoài lề — chạy TRƯỚC agent chính. Trước đây chỉ
 * dựa vào 1 bullet trong AGENT_SYSTEM_PROMPT (giải pháp mềm), nhưng vẫn lọt
 * câu hỏi ngoài lề trong thực tế, đặc biệt sau khi đổi OPENAI_MODEL sang
 * gpt-4.1-mini (non-reasoning, tuân thủ prompt nhiều điều kiện kém tin cậy
 * hơn). Dùng model rẻ (profile "fast" = gpt-4o-mini) + structured output để
 * phân loại — cùng pattern đã dùng ở specialty_name_analyzer.tool.ts.
 */
const TOPIC_GUARD_SYSTEM_PROMPT = `Bạn là bộ phân loại chủ đề cho LifeHealth, một nền tảng đặt lịch khám bệnh.

Nhiệm vụ: xem xét đoạn hội thoại (đặc biệt là tin nhắn CUỐI CÙNG của người dùng, trong ngữ cảnh các tin nhắn trước đó) và quyết định tin nhắn cuối có thuộc phạm vi hỗ trợ hay không.

Thuộc phạm vi (in_scope = true) nếu tin nhắn liên quan đến:
- Sức khỏe, triệu chứng, bệnh lý, thuốc men, tư vấn y tế.
- Sử dụng nền tảng LifeHealth: đặt lịch khám, bác sĩ, chuyên khoa, cơ sở y tế, hồ sơ sức khỏe của bản thân/người thân.
- Cách sử dụng và liên hệ/hỗ trợ chính thức của LifeHealth (hotline, email, địa chỉ, giờ làm việc, phí, chính sách).
- Số liệu/thống kê về nền tảng LifeHealth, ví dụ: hệ thống có bao nhiêu bác sĩ, có những chuyên khoa nào, danh sách bác sĩ/bài viết y tế — đây LUÔN thuộc phạm vi dù không nhắc "sức khỏe" hay "đặt lịch" trực tiếp.
- Lời chào, cảm ơn, câu trả lời ngắn (có/không/ok/vâng), câu hỏi làm rõ, hoặc bất kỳ tin nhắn nào là phần tiếp nối tự nhiên của một hội thoại đang thuộc phạm vi trên.

KHÔNG thuộc phạm vi (in_scope = false) nếu tin nhắn rõ ràng không liên quan, ví dụ: kiến thức tổng quát không liên quan y tế, lập trình, giải trí, thể thao, chính trị, tin tức, toán học/đố vui, yêu cầu viết code/văn bản không liên quan sức khỏe, v.v.

Nếu không chắc chắn, hãy nghiêng về in_scope = true (chỉ từ chối khi rõ ràng lạc đề).`;

const TOPIC_GUARD_REFUSAL_MESSAGE =
  "Xin lỗi, mình là trợ lý ảo của LifeHealth nên chỉ có thể hỗ trợ các câu hỏi về sức khỏe, đặt lịch khám và các dịch vụ trên nền tảng LifeHealth. Bạn có câu hỏi nào liên quan đến sức khỏe hoặc việc đặt lịch khám không, mình sẵn sàng hỗ trợ nhé!";

const topicGuardSchema = z.object({
  in_scope: z
    .boolean()
    .describe("true nếu tin nhắn cuối cùng thuộc phạm vi y tế/nền tảng LifeHealth"),
});

// Chỉ N tin nhắn gần nhất — đủ ngữ cảnh để tránh false-positive với lời
// chào/câu ngắn tiếp nối hội thoại y tế, không cần gửi toàn bộ lịch sử.
const GUARD_HISTORY_WINDOW = 6;

const guardModel = getChatModel({ profile: "fast", temperature: 0 });
const structuredGuardModel = guardModel.withStructuredOutput(topicGuardSchema, {
  method: "functionCalling",
});

async function classifyTopic(state: typeof MessagesAnnotation.State) {
  if (state.messages.length === 0) return { messages: [] };

  const recent = state.messages.slice(-GUARD_HISTORY_WINDOW);
  const latestUserMessage = [...recent]
    .reverse()
    .find((message) => message._getType() === "human");
  const latestUserText = String(latestUserMessage?.content ?? "");
  const priorContext = recent
    .filter((message) => message !== latestUserMessage)
    .map((message) => String(message.content ?? ""))
    .join(" ");
  if (isLifeHealthSupportRequest(latestUserText, priorContext)) return { messages: [] };

  let result: { in_scope: boolean } | undefined;
  try {
    result = await structuredGuardModel.invoke([
      new SystemMessage(TOPIC_GUARD_SYSTEM_PROMPT),
      ...recent,
    ]);
  } catch (error) {
    console.error("[TopicGuard] classification failed, failing open:", error);
    return { messages: [] };
  }

  // Gateway đôi khi không thực sự gọi function (invoke trả về undefined) —
  // fail-open thay vì crash, cùng cách xử lý phòng thủ đã dùng ở
  // specialty_name_analyzer.tool.ts.
  if (result && result.in_scope === false) {
    return {
      messages: [
        new AIMessage({
          content: TOPIC_GUARD_REFUSAL_MESSAGE,
          additional_kwargs: { topic_guard_refusal: true },
        }),
      ],
    };
  }
  return { messages: [] };
}

function shouldProceedAfterGuard(state: typeof MessagesAnnotation.State) {
  const last = state.messages[state.messages.length - 1] as
    | AIMessage
    | undefined;
  if (last?.additional_kwargs?.topic_guard_refusal === true) {
    return "__end__";
  }
  return "agent";
}

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

async function callTools(state: typeof MessagesAnnotation.State) {
  return toolNode.invoke(state);
}

/**
 * booking_appointment_tool tự tạo sẵn văn bản trả lời hoàn chỉnh (3 phần
 * Tóm tắt/Chi tiết/Lưu ý), và chatbot.service.ts đã ưu tiên lấy thẳng nội
 * dung ToolMessage này làm câu trả lời cuối thay vì AIMessage tổng hợp sau
 * đó — nghĩa là lượt gọi LLM thứ 2 (tools -> agent) chỉ để "chép lại y hệt"
 * bị vứt bỏ hoàn toàn, tốn thêm 1-3s độ trễ vô ích mỗi lần đặt lịch thành
 * công. Bỏ qua lượt gọi thừa này, kết thúc graph ngay sau tool.
 */
function shouldContinueAfterTools({ messages }: typeof MessagesAnnotation.State) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i] as any;
    if (message._getType?.() !== "tool") break;
    if (message.name === "booking_appointment_tool") return "__end__";
  }
  return "agent";
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("guard", classifyTopic)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addEdge("__start__", "guard")
  .addConditionalEdges("guard", shouldProceedAfterGuard)
  .addConditionalEdges("tools", shouldContinueAfterTools)
  .addConditionalEdges("agent", shouldContinue);

const agent = workflow.compile();

export default agent;
