import * as dotenv from "dotenv";
import { SqlDatabase } from "langchain/sql_db";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { getChatModel } from "../configs/llm.js";
import { pull } from "langchain/hub";
import { QuerySqlTool } from "langchain/tools/sql";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { AppDatasource } from "../database/data-source.js";

dotenv.config();

const setupQASql = async () => {
  await AppDatasource.initialize();

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: AppDatasource,
    includesTables: ["doctors_view", "articles_view", "specialties_view"],
  });

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
    profile: "fast",
    temperature: 0,
  });

  const queryPromptTemplate = await pull<ChatPromptTemplate>(
    "langchain-ai/sql-query-system-prompt"
  );

  const queryOutput = z.object({
    query: z.string().describe("Syntactically valid SQL query."),
  });

  const structuredLLM = llm.withStructuredOutput(queryOutput);

  const writeQuery = async (state: typeof InputStateAnnotation.State) => {
    const promptValue = await queryPromptTemplate.invoke({
      dialect: db.appDataSourceOptions.type,
      top_k: 10,
      table_info: await db.getTableInfo(),
      input: state.question,
    });

    const result = await structuredLLM.invoke(promptValue);
    return { query: result.query };
  };

  const executeQuery = async (state: typeof StateAnnotation.State) => {
    const executeQueryTool = new QuerySqlTool(db);
    return { result: await executeQueryTool.invoke(state.query) };
  };

  const generateAnswer = async (state: typeof StateAnnotation.State) => {
    const promptValue =
      "Given the following user question, corresponding SQL query, " +
      "and SQL result, answer the user question.\n\n" +
      `Question: ${state.question}\n` +
      `SQL Result: ${state.result}\n`;

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
  return qaSqlGraph;
};

// const graph = await setupQASql();
// const finalState = await graph.invoke({
//   question: "Cho tôi danh sách các chuyên khoa ?",
// });
// console.log(finalState);

export default setupQASql;
