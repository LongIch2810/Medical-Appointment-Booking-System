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
import type { ReportExecutionContext } from "../types/ReportAssistant.js";

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

export const ADMIN_REPORT_TABLES = [
  "chatbot_report_users_view",
  "chatbot_report_health_profiles_view",
  "chatbot_report_health_roadmaps_view",
  "chatbot_report_audit_view",
  "chatbot_report_appointments_view",
  "chatbot_report_doctor_schedules_view",
  "chatbot_report_doctors_view",
  "chatbot_report_specialties_view",
] as const;

export async function getAdminReportSchema(): Promise<string> {
  return db.getTableInfo();
}

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
  reportContext: Annotation<ReportExecutionContext | undefined>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  reportContext: Annotation<ReportExecutionContext | undefined>,
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
- Khi tính tổng từ cột đếm có hậu tố _count bằng SUM, bọc bằng COALESCE(SUM(column), 0) để kỳ không có bản ghi trả về 0 thay vì NULL. Không thay thế AVG bằng 0 và không tự tạo nhóm cho kết quả đã GROUP BY.
- Với tỷ lệ hoặc chỉ số dẫn xuất, dùng CTE/subquery để tính các tổng phụ trước rồi tính tỷ lệ ở query ngoài; bảo đảm mỗi query aggregate đều hợp lệ với PostgreSQL.
- Trả về câu SQL hợp lệ duy nhất, không thêm lời giải thích.
    `;

const queryPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", `${systemQaSqlPrompt}

For a confirmed report plan, use its dates, comparison period, metrics, grouping, and source views exactly. Date ranges include both endpoint dates. Do not add or omit filters, metrics, or groups, and do not substitute a different metric. Keep comparison periods distinguishable in the result. If the requested metric cannot be derived from the approved views, do not invent or approximate it.`],
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
    input: state.reportContext
      ? `${state.question}\n\nConfirmed report plan: ${JSON.stringify(state.reportContext)}`
      : state.question,
  });

  const response = await llmWithQueryTool.invoke(promptValue);
  const query = response.tool_calls?.[0]?.args?.query;
  return { query };
};

const executeQuery = async (state: typeof StateAnnotation.State) => {
  const safeQuery = assertSelectOnlyQuery(state.query, {
    allowedTables: state.reportContext?.sourceViews ?? ADMIN_REPORT_TABLES,
    maxRows: 1_000,
  });
  const rows = await withRetry(() => AdminReportDatasource.query(safeQuery), {
    operation: "admin_qa_sql_select",
  });
  return {
    query: safeQuery,
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
