import { config } from "dotenv";
config();
import { getChatModel } from "../configs/llm.js";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import initVectorDB from "../configs/vectordb.js";

async function setupRagGraph() {
  const llm = getChatModel({
    profile: "fast",
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
  const db = await initVectorDB();
  const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  const retrieve = async (state: typeof InputStateAnnotation.State) => {
    const retrievedDocs = await db.similaritySearch(state.question, 3);
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

  return ragGraph;
}

// const graph = await setupRagGraph();
// const finalState = await graph.invoke({
//   question: "Tính năng chính của dự án đặt bác sĩ là gì ?",
// });
// console.log(finalState);

export default setupRagGraph;
