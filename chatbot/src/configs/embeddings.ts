import { OpenAIEmbeddings } from "@langchain/openai";

export const OPENAI_EMBEDDING_BATCH_SIZE = 100;
export const OPENAI_EMBEDDING_TIMEOUT_MS = 30_000;
export const OPENAI_EMBEDDING_MAX_RETRIES = 2;
export const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
export const OPENAI_EMBEDDING_DIMENSIONS = 1_536;

export type OpenAIEmbeddingConfig = {
  apiKey: string;
  model: string;
  dimensions: number;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured`);
  }

  return value;
}

export function getOpenAIEmbeddingConfig(): OpenAIEmbeddingConfig {
  const model = requireEnv("OPENAI_EMBEDDING_MODEL");
  const dimensionsValue = requireEnv("OPENAI_EMBEDDING_DIMENSIONS");
  const dimensions = Number(dimensionsValue);

  if (model !== OPENAI_EMBEDDING_MODEL) {
    throw new Error(
      `OPENAI_EMBEDDING_MODEL must be ${OPENAI_EMBEDDING_MODEL}`,
    );
  }

  if (dimensions !== OPENAI_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `OPENAI_EMBEDDING_DIMENSIONS must be ${OPENAI_EMBEDDING_DIMENSIONS}`,
    );
  }

  return {
    apiKey: requireEnv("OPENAI_API_KEY"),
    model,
    dimensions,
  };
}

export function createOpenAIEmbeddings(
  config: OpenAIEmbeddingConfig = getOpenAIEmbeddingConfig(),
) {
  return new OpenAIEmbeddings({
    apiKey: config.apiKey,
    model: config.model,
    dimensions: config.dimensions,
    batchSize: OPENAI_EMBEDDING_BATCH_SIZE,
    timeout: OPENAI_EMBEDDING_TIMEOUT_MS,
    maxRetries: OPENAI_EMBEDDING_MAX_RETRIES,
  });
}
