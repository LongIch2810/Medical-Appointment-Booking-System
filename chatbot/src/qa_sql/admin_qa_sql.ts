import * as dotenv from "dotenv";
import { SqlDatabase } from "langchain/sql_db";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QuerySqlTool } from "langchain/tools/sql";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { DataSourceRoot } from "../database/data-source.js";

dotenv.config();

await DataSourceRoot.initialize();

const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: DataSourceRoot,
});

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
});

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

const systemQaSqlPrompt = `
Bạn là chuyên gia SQL có kinh nghiệm cao trong việc phân tích và thông kê.
Hãy viết câu lệnh SQL hợp lệ (theo cú pháp {dialect}) để trả lời câu hỏi của người dùng.
Dưới đây là thông tin về cấu trúc các bảng trong cơ sở dữ liệu:
{table_info}

Yêu cầu:
- Chỉ tạo câu SQL SELECT (không UPDATE, DELETE, INSERT, không thao tác làm hỏng DATABASE)
với các trường cần thiết với cấu trúc cơ sở dữ liệu.
- Không giới hạn kết quả bằng LIMIT trừ khi người dùng yêu cầu.
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

const queryOutput = z.object({
  query: z.string().describe("Syntactically valid SQL query."),
});

const structuredSqlLLM = llm.withStructuredOutput(queryOutput);

const writeQuery = async (state: typeof InputStateAnnotation.State) => {
  const promptValue = await queryPromptTemplate.invoke({
    dialect: db.appDataSourceOptions.type,
    table_info: await db.getTableInfo(),
    input: state.question,
  });

  const result = await structuredSqlLLM.invoke(promptValue);
  console.log("🧩 query:", result.query);
  return { query: result.query };
};

const executeQuery = async (state: typeof StateAnnotation.State) => {
  const executeQueryTool = new QuerySqlTool(db);
  return { result: await executeQueryTool.invoke(state.query) };
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
