import "dotenv/config";
import { getOpenAIEmbeddingConfig } from "../configs/embeddings.js";
import { buildKnowLedgeBase } from "../utils/buildKnowLedgeBase.js";

await buildKnowLedgeBase();

const embeddingConfig = getOpenAIEmbeddingConfig();
console.log(
  `Knowledge base is ready: collection=${process.env.QDRANT_COLLECTION_NAME}, model=${embeddingConfig.model}, dimensions=${embeddingConfig.dimensions}`,
);
