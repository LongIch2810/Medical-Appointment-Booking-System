import * as dotenv from "dotenv";
import { SqlDatabase } from "langchain/sql_db";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { getChatModel } from "../configs/llm.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  AdminReportDatasource,
  initializeWithRetry,
} from "../database/data-source.js";
import { assertSelectOnlyQuery } from "../utils/assertSelectOnlyQuery.js";
import { withRetry } from "../utils/retry.js";

dotenv.config();

await initializeWithRetry(AdminReportDatasource);

const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: AdminReportDatasource,
  includesTables: [
    "chatbot_report_users_view",
    "chatbot_report_health_profiles_view",
    "chatbot_report_health_roadmaps_view",
    "chatbot_report_audit_view",
    "chatbot_report_appointments_view",
    "chatbot_report_doctor_schedules_view",
    "chatbot_report_doctors_view",
    "chatbot_report_specialties_view",
  ],
});

const ADMIN_REPORT_TABLES = [
  "chatbot_report_users_view",
  "chatbot_report_health_profiles_view",
  "chatbot_report_health_roadmaps_view",
  "chatbot_report_audit_view",
  "chatbot_report_appointments_view",
  "chatbot_report_doctor_schedules_view",
  "chatbot_report_doctors_view",
  "chatbot_report_specialties_view",
] as const;

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
});

const llm = getChatModel({ temperature: 0 });

const systemQaSqlPrompt = `
Bạn là chuyên gia SQL có kinh nghiệm cao trong việc phân tích và thông kê.
Hãy viết câu lệnh SQL hợp lệ (theo cú pháp {dialect}) để trả lời câu hỏi của người dùng.
Dưới đây là thông tin về cấu trúc các bảng trong cơ sở dữ liệu:
{table_info}

Yêu cầu:
- Chỉ tạo câu SQL SELECT (không UPDATE, DELETE, INSERT, không thao tác làm hỏng DATABASE)
với các trường cần thiết với cấu trúc cơ sở dữ liệu.
- Chỉ truy vấn các view chatbot_report_* được cung cấp trong schema.
- Luôn giới hạn kết quả ở mức tối đa 1000 dòng.
- Nếu dùng hàm aggregate như SUM, COUNT hoặc AVG, mọi cột/biểu thức không aggregate trong SELECT bắt buộc phải nằm trong GROUP BY; không dùng SELECT * cùng aggregate.
- Với tỷ lệ hoặc chỉ số dẫn xuất, dùng CTE/subquery để tính các tổng phụ trước rồi tính tỷ lệ ở query ngoài; bảo đảm mỗi query aggregate đều hợp lệ với PostgreSQL.
- Trả về câu SQL hợp lệ duy nhất, không thêm lời giải thích.
    `;

const queryPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemQaSqlPrompt],
  [
    "human",
    `
Câu hỏi của người dùng: {input}
`,
  ],
]);

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
    table_info: await db.getTableInfo(),
    input: state.question,
  });

  const response = await llmWithQueryTool.invoke(promptValue);
  const query = response.tool_calls?.[0]?.args?.query;
  return { query };
};

const executeQuery = async (state: typeof StateAnnotation.State) => {
  const safeQuery = assertSelectOnlyQuery(state.query, {
    allowedTables: ADMIN_REPORT_TABLES,
    maxRows: 1_000,
  });
  const rows = await withRetry(() => AdminReportDatasource.query(safeQuery), {
    operation: "admin_qa_sql_select",
  });
  return {
    result: JSON.stringify(rows),
  };
};

const workflow = new StateGraph({
  stateSchema: StateAnnotation,
})
  .addNode("writeQuery", writeQuery)
  .addNode("executeQuery", executeQuery)
  .addEdge("__start__", "writeQuery")
  .addEdge("writeQuery", "executeQuery")
  .addEdge("executeQuery", "__end__");

const adminQaSqlGraph = workflow.compile();
export default adminQaSqlGraph;
