import * as dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";

dotenv.config();

export default async function initVectorDB(texts?: Document[]) {
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text-v2-moe",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  });
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (collection) => collection.name === process.env.QDRANT_COLLECTION_NAME,
  );

  let vectorstore: QdrantVectorStore;
  if (exists) {
    vectorstore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION_NAME,
    });
  } else {
    // Đảm bảo texts KHÔNG được undefined!
    if (!texts) {
      throw new Error(
        "texts must be provided when creating a new Qdrant collection!",
      );
    }
    vectorstore = await QdrantVectorStore.fromDocuments(texts, embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION_NAME,
    });
  }

  return vectorstore;
}
