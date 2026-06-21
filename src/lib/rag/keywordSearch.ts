import { prisma } from "@/lib/prisma";

export async function keywordSearchChunks(
  question: string,
  documentId?: string
) {
  if (documentId) {
    return prisma.$queryRaw`
      SELECT
        "id",
        "documentId",
        "content",
        "chunkIndex",
        ts_rank(
          to_tsvector('english', "content"),
          plainto_tsquery('english', ${question})
        ) AS rank
      FROM "DocumentChunk"
      WHERE "documentId" = ${documentId}
      AND to_tsvector('english', "content")
          @@ plainto_tsquery('english', ${question})
      ORDER BY rank DESC
      LIMIT 10
    `;
  }

  return prisma.$queryRaw`
    SELECT
      "id",
      "documentId",
      "content",
      "chunkIndex",
      ts_rank(
        to_tsvector('english', "content"),
        plainto_tsquery('english', ${question})
      ) AS rank
    FROM "DocumentChunk"
    WHERE to_tsvector('english', "content")
        @@ plainto_tsquery('english', ${question})
    ORDER BY rank DESC
    LIMIT 10
  `;
}