import { keywordSearchChunks } from "@/lib/rag/keywordSearch";
import { retrieveRelevantChunks } from "@/lib/rag/retrieveRelevantChunks";
import { retrieveAcrossDocuments } from "@/lib/rag/retrieveAcrossDocuments";

type VectorResult = {
    id: string;
    documentId: string;
    documentName?: string;
    content: string;
    chunkIndex: number;
    similarity?: number;
}

type KeywordResult = {
    id: string;
    documentId: string;
    documentName?: string;
    content: string;
    chunkIndex: number;
    rank: number;
}

export function mergeHybridResults(
    vectorResults: VectorResult[],
    keywordResults: KeywordResult[]
) {
    const resultsMap = new Map<string, VectorResult & {
         vectorScore: number;
         keywordScore: number;
         hybridScore: number;
    }>();

    for (const result of vectorResults) {
        resultsMap.set(result.id, {
            ...result,
            vectorScore: 1 - Number(result.similarity ?? 0),
            keywordScore: 0,
            hybridScore: 0,
        });
    }

    for (const result of keywordResults) {
        const existing = resultsMap.get(result.id);
        const keywordScore = Number(result.rank ?? 0);
    
        if (existing) {
          existing.keywordScore = keywordScore;
          existing.hybridScore = existing.vectorScore * 0.7 + keywordScore * 0.3;
        } else {
          resultsMap.set(result.id, {
            ...result,
            vectorScore: 0,
            keywordScore,
            hybridScore: keywordScore * 0.3,
          });
        }
    }

    return Array.from(resultsMap.values())
    .map((result) => ({
        ...result,
        hybridScore: result.vectorScore * 0.7 + result.keywordScore * 0.3,
    }))
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, 20);
}


export async function retrieveHybridChunks(
    documentId: string,
    question: string,
) {
    const vectorResults = await retrieveRelevantChunks(documentId, question);
    const keywordResults = await keywordSearchChunks(question, documentId);

    return mergeHybridResults(
        vectorResults as VectorResult[],
        keywordResults as KeywordResult[],
    );

}

export async function retrieveHybridAcrossDocuments(
    question: string,
) {

    const vectorResults = await retrieveAcrossDocuments(question);

    const keywordResults = await keywordSearchChunks(question);

    return mergeHybridResults(
        vectorResults as VectorResult[],
        keywordResults as KeywordResult[],
    );
}