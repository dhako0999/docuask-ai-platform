type ChunkForRerank = {
    id: string;
    documentId?: string;
    documentName?: string;
    content: string;
    chunkIndex: number;
    similarity?: number;
    vectorScore?: number;
    keywordScore?: number;
    hybridScore?: number;
}

export function simpleRerankChunks(
    question: string,
    chunks: ChunkForRerank[],
    limit = 5
) {
    const questionTerms = question.toLowerCase().split(/\W+/).filter((term) => term.length > 2);

    return chunks
    .map((chunk) => {
        const content = chunk.content.toLowerCase();

        const termMatches = questionTerms.filter((term) => 
            content.includes(term)
        ).length;

        const rerankScore = Number(chunk.hybridScore ?? 0) + termMatches * 0.05;

        return {
            ...chunk,
            rerankScore,
        };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, limit);
}