import * as dotenv from "dotenv";
import { SqlDatabase } from "langchain/sql_db";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { getChatModel } from "../configs/llm.js";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AppDatasource, initializeWithRetry } from "../database/data-source.js";
import { assertSelectOnlyQuery } from "../utils/assertSelectOnlyQuery.js";
import { withRetry } from "../utils/retry.js";

dotenv.config();

// ⚠️ Toàn bộ phần khởi tạo dưới đây chỉ được chạy MỘT LẦN khi module này
// được import lần đầu (giống admin_qa_sql.ts). Tuyệt đối không gọi lại
// AppDatasource.initialize() ở mỗi request — DataSource là singleton dùng
// chung toàn app, gọi initialize() lần 2 trở đi sẽ throw
// CannotConnectAlreadyConnectedError, khiến truy vấn "lúc được lúc không".
await initializeWithRetry(AppDatasource);

const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: AppDatasource,
  includesTables: ["doctors_view", "articles_view", "specialties_view"],
});

const PUBLIC_QA_TABLES = [
  "doctors_view",
  "articles_view",
  "specialties_view",
] as const;

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
  answer: Annotation<string>,
});

const llm = getChatModel({
  temperature: 0,
});

const queryPromptTemplate = await withRetry(
  () => pull<ChatPromptTemplate>("langchain-ai/sql-query-system-prompt"),
  { operation: "sql_prompt_pull" },
);

const extractSqlQueryTool = tool(async () => "", {
  name: "extract_sql_query",
  description:
    "Return the syntactically valid SQL query that answers the question.",
  schema: z.object({
    query: z.string().describe("Syntactically valid SQL query."),
  }),
});

const llmWithQueryTool = llm.bindTools([extractSqlQueryTool], {
  tool_choice: "extract_sql_query",
});

const writeQuery = async (state: typeof InputStateAnnotation.State) => {
  const promptValue = await queryPromptTemplate.invoke({
    dialect: db.appDataSourceOptions.type,
    top_k: 10,
    table_info: await db.getTableInfo(),
    input: state.question,
  });

  const response = await llmWithQueryTool.invoke(promptValue);
  const query = response.tool_calls?.[0]?.args?.query;
  return { query };
};

const executeQuery = async (state: typeof StateAnnotation.State) => {
  const safeQuery = assertSelectOnlyQuery(state.query, {
    allowedTables: PUBLIC_QA_TABLES,
    maxRows: 200,
  });
  const rows = await withRetry(() => AppDatasource.query(safeQuery), {
    operation: "qa_sql_select",
  });
  return {
    result: JSON.stringify(rows),
  };
};

const generateAnswer = async (state: typeof StateAnnotation.State) => {
  const promptValue =
    "Dựa vào câu hỏi và kết quả truy vấn SQL dưới đây, hãy trả lời câu hỏi của người dùng.\n" +
    "Trình bày câu trả lời theo ĐÚNG cấu trúc Markdown sau, không thêm/bớt tiêu đề:\n\n" +
    "**Tóm tắt**\n<câu trả lời ngắn gọn>\n\n" +
    "**Chi tiết**\n<liệt kê/giải thích đầy đủ dựa trên kết quả SQL>\n\n" +
    "**Lưu ý & Bước tiếp theo**\n<gợi ý hành động tiếp theo phù hợp, ví dụ mời đặt lịch khám nếu câu hỏi liên quan đến bác sĩ/chuyên khoa>\n\n" +
    `Câu hỏi: ${state.question}\n` +
    `Kết quả SQL: ${state.result}\n\n` +
    "Trả lời bằng đúng ngôn ngữ của câu hỏi.";

  const response = await llm.invoke(promptValue);
  return { answer: response.content };
};

const graphBuilder = new StateGraph({
  stateSchema: StateAnnotation,
})
  .addNode("writeQuery", writeQuery)
  .addNode("executeQuery", executeQuery)
  .addNode("generateAnswer", generateAnswer)
  .addEdge("__start__", "writeQuery")
  .addEdge("writeQuery", "executeQuery")
  .addEdge("executeQuery", "generateAnswer")
  .addEdge("generateAnswer", "__end__");

const qaSqlGraph = graphBuilder.compile();

export default qaSqlGraph;
