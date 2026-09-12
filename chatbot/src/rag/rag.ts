import { config } from "dotenv";
config();
import { getChatModel } from "../configs/llm.js";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import initVectorDB from "../configs/vectordb.js";
import { withRetry } from "../utils/retry.js";

const llm = getChatModel({
  temperature: 0,
});

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

// Khởi tạo MỘT LẦN lúc import module (giống qa_sql.ts) — trước đây mỗi lần
// rag_tool được gọi, setupRagGraph() sẽ tạo QdrantClient mới, xác nhận lại
// collection, và pull lại prompt từ hub.langchain.com, cộng thêm vài giây
// độ trễ mạng cho mỗi câu hỏi cần RAG.
const db = await initVectorDB();

// Prompt inline thay cho pull("rlm/rag-prompt") từ LangChain Hub — vừa loại
// bỏ hẳn 1 lệnh fetch mạng ra ngoài, vừa bắt buộc câu trả lời tuân theo
// template chuẩn của chatbot (Tóm tắt/Chi tiết/Lưu ý & Bước tiếp theo).
const prompt = ChatPromptTemplate.fromTemplate(
  `Bạn là trợ lý trả lời câu hỏi dựa trên tài liệu nội bộ của phòng khám được cung cấp dưới đây. Nếu tài liệu không đủ thông tin để trả lời, hãy nói rõ là không tìm thấy thông tin thay vì tự suy đoán.

Trình bày câu trả lời theo ĐÚNG cấu trúc Markdown sau, không thêm/bớt tiêu đề:

**Tóm tắt**
<câu trả lời ngắn gọn>

**Chi tiết**
<giải thích dựa trên tài liệu được cung cấp>

**Lưu ý & Bước tiếp theo**
<gợi ý liên quan nếu có, ví dụ liên hệ phòng khám hoặc đặt lịch khám>

Tài liệu tham khảo:
{context}

Câu hỏi: {question}

Trả lời bằng đúng ngôn ngữ của câu hỏi.`,
);

const retrieve = async (state: typeof InputStateAnnotation.State) => {
  const retrievedDocs = await withRetry(
    () => db.similaritySearch(state.question, 3),
    { operation: "qdrant_similarity_search" },
  );
  return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const docsContent = state.context.map((doc) => doc.pageContent).join("\n");
  const messages = await prompt.invoke({
    question: state.question,
    context: docsContent,
  });
  const response = await llm.invoke(messages);
  return { answer: response.content };
};

const ragGraph = new StateGraph(StateAnnotation)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge("__start__", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "__end__")
  .compile();

export default ragGraph;
