import { prisma } from "@/lib/prisma";
import { createEmbedding } from "./embeddings";

type RetrievedDocumentChunk = {
    id: string;
    documentId: string;
    documentName: string;
    content: string;
    chunkIndex: number;
    similarity: number;
    
};

export async function retrieveAcrossDocuments(
   question: string
) : Promise<RetrievedDocumentChunk[]> {

    const questionEmbedding = await createEmbedding(question);

    const vectorString = `[${questionEmbedding.join(",")}]`;

    const chunks = await prisma.$queryRaw<RetrievedDocumentChunk[]>`
        SELECT
            dc.id,
            dc."documentId",
            d.name AS "documentName",
            dc.content,
            dc."chunkIndex",
            1 - (dc.embedding <=> ${vectorString}::vector) AS similarity
        FROM "DocumentChunk" dc
        JOIN "Document" d
            ON d.id = dc."documentId"
        WHERE dc.embedding IS NOT NULL
            AND d.status = 'ready'
        ORDER BY dc.embedding <=> ${vectorString}::vector
        LIMIT 10
        `;

    console.log(
        chunks.map((chunk) => ({
            documentName: chunk.documentName,
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity,
            preview: chunk.content.slice(0, 120),
        }))
    );

    return chunks;

}

