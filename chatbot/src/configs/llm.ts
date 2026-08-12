import { ChatOpenAI } from "@langchain/openai";

export function getChatModel(opts?: {
  model?: string;
  profile?: "default" | "fast";
  temperature?: number;
}) {
  const configuredModel =
    opts?.profile === "fast"
      ? process.env.LLM_FAST_MODEL
      : process.env.LLM_MODEL;

  return new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: opts?.model ?? configuredModel,
    temperature: opts?.temperature ?? 0,
    configuration: { baseURL: process.env.LLM_BASE_URL },
  });
}

export function getVisionModel(opts?: { temperature?: number }) {
  return new ChatOpenAI({
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_VISION_MODEL,
    temperature: opts?.temperature ?? 0,
    configuration: { baseURL: process.env.LLM_BASE_URL },
  });
}
