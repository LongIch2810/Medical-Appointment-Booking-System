import { createHash } from "node:crypto";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// Qdrant point IDs must be a UUID or an unsigned integer, so the source+index
// hash is reformatted into UUID shape (8-4-4-4-12) instead of used as-is.
function toStablePointId(hex: string): string {
  const padded = hex.slice(0, 32).padEnd(32, "0");
  return [
    padded.slice(0, 8),
    padded.slice(8, 12),
    padded.slice(12, 16),
    padded.slice(16, 20),
    padded.slice(20, 32),
  ].join("-");
}

export default async function splitDocuments(
  documents: Document[]
): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 30,
  });

  const texts = await splitter.splitDocuments(documents);

  // Stamp a deterministic point ID (stable across rebuilds as long as the
  // source path and the chunk's position within that source don't change)
  // and a content checksum, so vectordb.ts can diff incoming chunks against
  // what's already stored instead of blindly re-inserting or no-op'ing.
  const chunkIndexBySource = new Map<string, number>();
  for (const chunk of texts) {
    const source = String(chunk.metadata?.source ?? "");
    const chunkIndex = chunkIndexBySource.get(source) ?? 0;
    chunkIndexBySource.set(source, chunkIndex + 1);

    const pointId = toStablePointId(sha256Hex(`${source}#${chunkIndex}`));
    chunk.metadata.checksum = sha256Hex(chunk.pageContent);
    chunk.metadata.pointId = pointId;
    chunk.id = pointId;
  }

  return texts;
}
