import "dotenv/config";

import crypto from "crypto";

import { PrismaClient } from "@prisma/client";

import { chunkText } from "../src/lib/rag/chunkText";

import { createEmbedding } from "../src/lib/rag/embeddings";

const prisma = new PrismaClient();

async function reindexDocument(documentId: string) {

    const document = await prisma.document.findUnique({
        where: {
            id: documentId
        }
    });

    if(!document) {
        console.error(`Document not found ${documentId}`);
        return;
    }
    
    console.log(`Document name: ${document.name}`);

    await prisma.document.update({
        where: {
            id: document.id
        },
        data: {
            status: "processing",
        },
    });

    try {

        await prisma.documentChunk.deleteMany({
            where: {
                documentId: document.id,
            },
        });

        const chunks = chunkText(document.content);

        for (const chunk of chunks) {
            const embedding = await createEmbedding(chunk.content);
            const vectorString = `[${embedding.join(",")}]`;

            await prisma.$executeRaw`
                INSERT INTO "DocumentChunk" (
                    "id",
                    "documentId",
                    "content",
                    "chunkIndex",
                    "embedding",
                    "createdAt"
                )
                VALUES (
                     ${crypto.randomUUID()}
                     ${document.id}
                     ${chunk.content}
                     ${chunk.chunkIndex}
                     ${vectorString}::vector,
                     NOW()
                )     
            `;

            
        }

        await prisma.document.update({
            where: {
                id: document.id,
            },
            data: {
                status: "ready",
            },
        });

        console.log(`Finished: ${document.name}`);

    } catch (error) {
        await prisma.document.update({
            where: {
                id: document.id,
            },
            data: {
                status: "failed",
            },
        });

        console.error(`Failed to reindex: ${document.name}`);
        throw error;
        
    }
}

async function main() {
    const documentId = process.argv[2];

    if(documentId) {
        await reindexDocument(documentId);
        return;
    }

    const documents = await prisma.document.findMany();

    for (const document of documents) {
        await reindexDocument(document.id);
    }
}
