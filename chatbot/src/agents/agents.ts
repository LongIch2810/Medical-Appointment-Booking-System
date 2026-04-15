import * as dotenv from "dotenv";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
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

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
}).bindTools(tools);

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await llm.invoke(state.messages);

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
