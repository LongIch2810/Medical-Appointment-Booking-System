import * as dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import {
  createOpenAIEmbeddings,
  getOpenAIEmbeddingConfig,
} from "./embeddings.js";
import { withRetry } from "../utils/retry.js";

dotenv.config();

const OPENAI_COLLECTION_NAME = "BOOKING_DOCTOR_SYSTEM_OPENAI_TE3_SMALL_V1";

type QdrantConfig = {
  url: string;
  apiKey: string;
  collectionName: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be configured`);
  }

  return value;
}

function getQdrantConfig(): QdrantConfig {
  const collectionName = requireEnv("QDRANT_COLLECTION_NAME");

  if (collectionName !== OPENAI_COLLECTION_NAME) {
    throw new Error(
      `QDRANT_COLLECTION_NAME must be ${OPENAI_COLLECTION_NAME}; refusing to write OpenAI vectors to another collection`,
    );
  }

  return {
    url: requireEnv("QDRANT_URL"),
    apiKey: requireEnv("QDRANT_API_KEY"),
    collectionName,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractVectorSize(collection: unknown): number | undefined {
  if (!isRecord(collection) || !isRecord(collection.config)) {
    return undefined;
  }

  const params = collection.config.params;
  if (!isRecord(params) || !isRecord(params.vectors)) {
    return undefined;
  }

  if (typeof params.vectors.size === "number") {
    return params.vectors.size;
  }

  const namedVectorSizes = Object.values(params.vectors)
    .filter(isRecord)
    .map((vector) => vector.size)
    .filter((size): size is number => typeof size === "number");

  return namedVectorSizes.length === 1 ? namedVectorSizes[0] : undefined;
}

async function assertCollectionVectorSize(
  client: QdrantClient,
  collectionName: string,
  expectedDimensions: number,
) {
  const collection = await withRetry(
    () => client.getCollection(collectionName),
    { operation: "qdrant_get_collection" },
  );
  const actualDimensions = extractVectorSize(collection);

  if (actualDimensions !== expectedDimensions) {
    throw new Error(
      `Qdrant collection ${collectionName} has vector size ${actualDimensions ?? "unknown"}; expected ${expectedDimensions}`,
    );
  }
}

async function scrollExistingChecksums(
  client: QdrantClient,
  collectionName: string,
): Promise<Map<string, string>> {
  const checksumById = new Map<string, string>();
  let offset: string | number | null | undefined;

  do {
    const response = await withRetry(
      () =>
        client.scroll(collectionName, {
          limit: 256,
          offset: offset ?? undefined,
          with_payload: ["metadata"],
          with_vector: false,
        }),
      { operation: "qdrant_scroll" },
    );

    for (const point of response.points) {
      const payload = point.payload;
      const metadata =
        isRecord(payload) && isRecord(payload.metadata)
          ? payload.metadata
          : undefined;
      const checksum =
        metadata && typeof metadata.checksum === "string"
          ? metadata.checksum
          : undefined;
      if (checksum) {
        checksumById.set(String(point.id), checksum);
      }
    }

    offset = response.next_page_offset as string | number | null | undefined;
  } while (offset !== undefined && offset !== null);

  return checksumById;
}

export interface ReconcileResult {
  upserted: number;
  deleted: number;
  unchanged: number;
}

async function reconcileCollection(
  client: QdrantClient,
  vectorstore: QdrantVectorStore,
  collectionName: string,
  incoming: Document[],
): Promise<ReconcileResult> {
  const existingChecksumById = await scrollExistingChecksums(
    client,
    collectionName,
  );

  const incomingIds = new Set<string>();
  const toUpsert: Document[] = [];
  const toUpsertIds: string[] = [];

  for (const chunk of incoming) {
    const pointId = chunk.metadata?.pointId as string | undefined;
    const checksum = chunk.metadata?.checksum as string | undefined;
    if (!pointId || !checksum) {
      throw new Error(
        "Document chunk is missing metadata.pointId/checksum; run it through splitDocuments() first",
      );
    }

    incomingIds.add(pointId);
    if (existingChecksumById.get(pointId) !== checksum) {
      toUpsert.push(chunk);
      toUpsertIds.push(pointId);
    }
  }

  const toDeleteIds = [...existingChecksumById.keys()].filter(
    (id) => !incomingIds.has(id),
  );

  if (toUpsert.length > 0) {
    await withRetry(
      () => vectorstore.addDocuments(toUpsert, { ids: toUpsertIds }),
      { operation: "qdrant_upsert" },
    );
  }

  if (toDeleteIds.length > 0) {
    await withRetry(() => vectorstore.delete({ ids: toDeleteIds }), {
      operation: "qdrant_delete",
    });
  }

  return {
    upserted: toUpsert.length,
    deleted: toDeleteIds.length,
    unchanged: incomingIds.size - toUpsert.length,
  };
}

export default async function initVectorDB(texts?: Document[]) {
  const embeddingConfig = getOpenAIEmbeddingConfig();
  const qdrantConfig = getQdrantConfig();
  const embeddings = createOpenAIEmbeddings(embeddingConfig);
  const client = new QdrantClient({
    url: qdrantConfig.url,
    apiKey: qdrantConfig.apiKey,
  });

  const collections = await withRetry(
    () => client.getCollections(),
    { operation: "qdrant_get_collections" },
  );
  const exists = collections.collections.some(
    (collection) => collection.name === qdrantConfig.collectionName,
  );

  let vectorstore: QdrantVectorStore;
  if (exists) {
    await assertCollectionVectorSize(
      client,
      qdrantConfig.collectionName,
      embeddingConfig.dimensions,
    );
    vectorstore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantConfig.url,
      apiKey: qdrantConfig.apiKey,
      collectionName: qdrantConfig.collectionName,
    });

    // texts is only passed by the explicit knowledge:build script/dev
    // startup path — production boot with no texts stays purely read-only
    // (attach to the existing collection, never rebuild unprompted).
    if (texts) {
      await reconcileCollection(
        client,
        vectorstore,
        qdrantConfig.collectionName,
        texts,
      );
    }
  } else {
    if (!texts) {
      throw new Error(
        `Qdrant collection ${qdrantConfig.collectionName} does not exist; run npm run knowledge:build before starting production`,
      );
    }
    // Relies on each chunk's `.id` (stamped by splitDocuments as a
    // deterministic hash of source+chunkIndex) rather than the random UUID
    // QdrantVectorStore.addDocuments falls back to, so a later rebuild's
    // reconcileCollection() can recognize and update these same points.
    vectorstore = await QdrantVectorStore.fromDocuments(texts, embeddings, {
      url: qdrantConfig.url,
      apiKey: qdrantConfig.apiKey,
      collectionName: qdrantConfig.collectionName,
    });
    await assertCollectionVectorSize(
      client,
      qdrantConfig.collectionName,
      embeddingConfig.dimensions,
    );
  }

  return vectorstore;
}
