import { prisma } from "@/lib/prisma";
import { retrieveHybridChunks } from "@/lib/rag/hybridSearch";
import { simpleRerankChunks } from "@/lib/rag/rerank";

export async function POST(req: Request) {
  const body: {
    documentId: string;
    question: string;
  } = await req.json();

  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    return new Response("AI_SERVICE_URL is not configured", {
      status: 500,
    });
  }

  const document = await prisma.document.findUnique({
    where: {
      id: body.documentId,
    },
  });

  if (!document) {
    return new Response("Document not found", {
      status: 404,
    });
  }

  const hybridChunks = await retrieveHybridChunks(
    body.documentId,
    body.question
  );

  const relevantChunks = await simpleRerankChunks(
    body.question,
    hybridChunks,
    5
  );

console.log("Hybrid chunks:", hybridChunks.length);

console.log("Reranked chunks:", relevantChunks.length);

console.log(
  "Reranked previews:",
  relevantChunks.map((chunk) => ({
    chunkIndex: chunk.chunkIndex,
    hybridScore: chunk.hybridScore,
    rerankScore: chunk.rerankScore,
    preview: chunk.content.slice(0, 100),
  }))
);


  const context = hybridChunks
    .map(
      (chunk, index) => `
Source ${index + 1}
Document: ${document.name}
Chunk Index: ${chunk.chunkIndex}
Content: ${chunk.content}
`
    )
    .join("\n\n");

  const response = await fetch(`${aiServiceUrl}/answer-question-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: body.question,
      context,
      mode: "selected",
    }),
  });

  if (!response.ok || !response.body) {
    return new Response("AI service stream failed", {
      status: 500,
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}