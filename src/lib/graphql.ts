export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    
    const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    const json = await res.json();

    if(!res.ok || json.errors) {
        console.error("GraphQL error response:", json);

        throw new Error(
            json.errors?.[0]?.message || "GraphQL request failed"

        );
    }

    return json.data;
}

export type AnswerSource = {
    sourceNumber: number;
    documentId: string;
    documentName: string;
    chunkIndex: number;
    similarity?: number;
    preview: string;
};

export async function askAcrossDocuments(question: string): Promise<{answer: string; sources: AnswerSource[]}> {

    const data = await graphqlRequest<{
        askAcrossDocuments: {
            answer: string;
            sources: AnswerSource[];
        };
    }>(
        `
           mutation AskAcrossDocuments($question: String!) {
                askAcrossDocuments(question: $question) {
                    answer
                    sources {
                        sourceNumber
                        documentId
                        documentName
                        chunkIndex
                        similarity
                        preview
                    }
                }
            }
        
        `,
        {
            question,
        }
    );

    return data.askAcrossDocuments;

}

export async function analyzeDocument(
    documentId: string
): Promise<{ analysis: string }> {
    const data = await graphqlRequest< {
        analyzeDocument: {
            analysis: string;
        };
    }>(
        `
           mutation AnalyzeDocument($documentId: ID!) {
               analyzeDocument(documentId: $documentId) {
                    analysis
               }
           }
        
        `,
        {
            documentId,
        }
    );

    return data.analyzeDocument;
}

export async function researchAcrossDocuments(
    question: string
): Promise<{ report: string; sources: AnswerSource[] }>  {
    const data = await graphqlRequest< {
        researchAcrossDocuments: {
            report: string;
            sources: AnswerSource[];

        };
    }>(
        `
           mutation ResearchAcrossDocuments($question: String!) {
               researchAcrossDocuments(question: $question) {
                   report
                   sources {
                     sourceNumber
                     documentId
                     documentName
                     chunkIndex
                     similarity
                     preview
                   }
               }
           
           }
        
        `,
        {
            question,
        }
    );

    return data.researchAcrossDocuments;

}

export async function compareDocuments(
    documentAId: string,
    documentBId: string
  ): Promise<{ comparison: string }> {
    const data = await graphqlRequest<{
      compareDocuments: {
        comparison: string;
      };
    }>(
      `
        mutation CompareDocuments($documentAId: ID!, $documentBId: ID!) {
          compareDocuments(documentAId: $documentAId, documentBId: $documentBId) {
            comparison
          }
        }
      `,
      {
        documentAId,
        documentBId,
      }
    );
  
    return data.compareDocuments;
  }