import { prisma } from "@/lib/prisma";

import { createEmbedding } from "./embeddings";

type RetrievedChunk = {
    id: string;
    content: string;
    chunkIndex: number;
    similarity: number;
};

export async function retrieveRelevantChunks(
    documentId: string,
    question: string,
) {
    const questionEmbedding = await createEmbedding(question);

    const chunks = await prisma.$queryRaw<RetrievedChunk[]>`
         SELECT
             id,
             content,
             "chunkIndex",
             1 - (embedding <=> ${questionEmbedding}::vector) as similarity
        FROM "DocumentChunk"
        WHERE "documentId" = ${documentId}
        ORDER BY embedding <=> ${questionEmbedding}::vector
        LIMIT 5    
    `;

    return chunks;

}
