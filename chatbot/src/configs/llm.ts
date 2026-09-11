import { ChatOpenAI } from "@langchain/openai";
import { createRetryingFetch } from "../utils/retry.js";

// Bắt buộc phải có timeout — trước đây `timeout` chỉ được set khi caller
// TỰ truyền opts.timeoutMs (không caller nào làm việc đó), nên request có
// thể treo vô thời hạn. Giờ luôn có default, override được qua env.
const DEFAULT_CHAT_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 30_000;
const DEFAULT_VISION_TIMEOUT_MS = Number(process.env.VISION_TIMEOUT_MS) || 45_000;
// Ngân sách tổng cho toàn bộ chuỗi retry của một request LLM — không reset
// lại ở mỗi attempt (xem retry.ts withRetry's totalTimeoutMs).
const LLM_TOTAL_TIMEOUT_MS =
  Number(process.env.LLM_TOTAL_TIMEOUT_MS) || DEFAULT_VISION_TIMEOUT_MS + 15_000;

const retryingFetch = createRetryingFetch(fetch, {
  totalTimeoutMs: LLM_TOTAL_TIMEOUT_MS,
});

type ChatModelProfile = "default" | "fast" | "quality";

function getReasoningEffort(model: string, profile: ChatModelProfile) {
  // The original GPT-5 family uses "minimal" as its cheapest reasoning mode.
  // Newer GPT-5.x models use "none" for the equivalent low-latency mode.
  if (/^gpt-5(?:-(?:mini|nano))?(?:-\d{4}-\d{2}-\d{2})?$/.test(model)) {
    return profile === "quality" ? "low" : "minimal";
  }

  if (/^gpt-5\.\d+/.test(model)) {
    return profile === "quality" ? "low" : "none";
  }

  return undefined;
}

export function getChatModel(opts?: {
  model?: string;
  profile?: ChatModelProfile;
  temperature?: number;
  timeoutMs?: number;
  totalTimeoutMs?: number;
}) {
  const profile = opts?.profile ?? "default";
  const configuredModel =
    profile === "fast"
      ? process.env.OPENAI_FAST_MODEL ?? process.env.OPENAI_MODEL
      : process.env.OPENAI_MODEL;
  const model = opts?.model ?? configuredModel;

  if (!model) {
    throw new Error("OPENAI_MODEL is required");
  }

  const reasoningEffort = getReasoningEffort(model, profile);
  const modelFetch = opts?.totalTimeoutMs
    ? createRetryingFetch(fetch, { totalTimeoutMs: opts.totalTimeoutMs })
    : retryingFetch;

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model,
    // GPT-5 reasoning models reject temperature unless they support and use
    // reasoning_effort="none". Omit it for minimal/low reasoning profiles.
    ...(reasoningEffort && reasoningEffort !== "none"
      ? {}
      : { temperature: opts?.temperature ?? 0 }),
    ...(reasoningEffort
      ? { modelKwargs: { reasoning_effort: reasoningEffort } }
      : {}),
    maxRetries: 0,
    timeout: opts?.timeoutMs ?? DEFAULT_CHAT_TIMEOUT_MS,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
      fetch: modelFetch,
    },
  });
}

export function getVisionModel(opts?: { temperature?: number; timeoutMs?: number }) {
  const model = process.env.OPENAI_VISION_MODEL;

  if (!model) {
    throw new Error("OPENAI_VISION_MODEL is required");
  }

  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model,
    temperature: opts?.temperature ?? 0,
    maxRetries: 0,
    timeout: opts?.timeoutMs ?? DEFAULT_VISION_TIMEOUT_MS,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL,
      fetch: retryingFetch,
    },
  });
}
