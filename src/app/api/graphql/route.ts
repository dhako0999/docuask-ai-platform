import { createSchema, createYoga } from "graphql-yoga";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { openai } from "@/lib/openai";

import { chunkText } from "@/lib/rag/chunkText";
import { createEmbedding } from "@/lib/rag/embeddings";

import { retrieveRelevantChunks } from "@/lib/rag/retrieveRelevantChunks";
import { retrieveAcrossDocuments} from "@/lib/rag/retrieveAcrossDocuments";
 

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Document {
      id: ID!
      name: String!
      size: Int!
      type: String!
      s3Key: String!
      content: String!
      status: String!
      uploadedAt: String!
      createdAt: String!
      chunkCount: Int!
    }

    input CreateDocumentInput {
      name: String!
      size: Int!
      type: String!
      s3Key: String!
      content: String!
      status: String!
    }

    type Query {
      documents: [Document!]!
      conversation(documentId: ID!): Conversation
    }

    type Mutation {
      createDocument(input: CreateDocumentInput!): Document!
      deleteDocument(id: ID!): Boolean!
      askQuestion(documentId: ID!, question: String!): AskQuestionResponse!
    }

    type AskQuestionResponse {
      answer: String!
    }

    type Conversation {
      id: ID!
      documentId: ID!
      createdAt: String!
      messages: [ChatMessage!]!
    
    }

    type ChatMessage {
      id: ID!
      conversationId: ID!
      role: String!
      content: String!
      createdAt: String!
    }

    type MultiDocumentAnswer {
      answer: String!,
      sources: [AnswerSource!]!,
    
    }

    extend type Mutation {
      askAcrossDocuments(question: String!): MultiDocumentAnswer!
      analyzeDocument(documentId: ID!): DocumentAnalysis!
      researchAcrossDocuments(question: String!): ResearchReport!
      compareDocuments(documentAId: ID!, documentBId: ID!): DocumentComparison!
    }

    type AnswerSource {
       sourceNumber: Int!,
       documentId: ID!,
       documentName: String!,
       chunkIndex: Int!,
       similarity: Float,
       preview: String!
    
    }

    type DocumentAnalysis {
       analysis: String!
    }

    type ResearchReport {
       report: String!
       sources: [AnswerSource!]!
    }

    type DocumentComparison {
      comparison: String!
    }


  `,

  resolvers: {
    Query: {
      documents: async () => {
        const documents = await prisma.document.findMany({
          orderBy: {
            uploadedAt: "desc",
          },
          include: {
            _count: {
              select: {
                chunks: true,
              },
            },
          },
        });

        return documents.map((document) => ({
          ...document,
          chunkCount: document._count.chunks,
        }));
      },
      conversation: async (_parent, args: { documentId: string }) => {
        return prisma.conversation.findFirst({
          where: {
            documentId: args.documentId,
          },
          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
      },
    },

    Mutation: {
      deleteDocument: async (_parent, args: { id: string }) => {
        const document = await prisma.document.findUnique({
          where: {
            id: args.id,
          },
        });

        if (!document) {
          throw new Error("Document not found");
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: document.s3Key,
            })
        );

        await prisma.document.delete({
            where: {
                id: args.id,
            },
        });

        return true;
      },
      createDocument: async (
        _parent,
        args: {
          input: {
            name: string;
            size: number;
            type: string;
            s3Key: string;
            content: string;
            status: string;
          };
        }
      ) => {

        const document = await prisma.document.create({
          data: {
            name: args.input.name,
            size: args.input.size,
            type: args.input.type,
            s3Key: args.input.s3Key,
            content: args.input.content,
            status: "processing",
          },
        });
        
      
        try {
         /* const chunks = chunkText(args.input.content);
      
          const embeddings = await Promise.all(
            chunks.map((chunk) => createEmbedding(chunk.content))
          );
      
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = embeddings[i];
      
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
                gen_random_uuid(),
                ${document.id},
                ${chunk.content},
                ${chunk.chunkIndex},
                ${embedding}::vector,
                NOW()
              )
            `;
          }
      
          const readyDocument = await prisma.document.update({
            where: {
              id: document.id,
            },
            data: {
              status: "Ready",
            },
          });

          return readyDocument;
          
          */

         
  
          const res = await fetch(`${process.env.AI_SERVICE_URL}/process-document`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              document_id: document.id,
            }),
          });

          if(!res.ok) {
            throw new Error("Failed to queue document processing");
          }

          return document;
      
          
        } catch (error) {
          await prisma.document.update({
            where: {
              id: document.id,
            },
            data: {
              status: "failed",
            },
          });
      
          throw error;
        }
        
      },
      askQuestion: async (
        _parent,
        args: { documentId: string, question: string }
      ) => {
        console.log("askQuestion args:", args);
        console.log("documentId received:", args.documentId);

        const document = await prisma.document.findUnique({
          where: {
            id: args.documentId,
          },
        });

        if(!document) {
          throw new Error("Document not found");
        }

        let conversation = await prisma.conversation.findFirst({
          where: {
            documentId: args.documentId,
          },
        });


        if(!conversation) {
           conversation = await prisma.conversation.create({
               data: {
                  documentId: args.documentId,
               },
           });
        }

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: args.question,
          },
            
        });

        const relevantChunks = await retrieveRelevantChunks(
          args.documentId,
          args.question
        );


        console.log("Question:", args.question);
        console.log(
            relevantChunks.map(chunk => ({
              chunkIndex: chunk.chunkIndex,
              similarity: chunk.similarity,
              preview: chunk.content.slice(0, 100),
            }))
        );

        const context = relevantChunks.map((chunk, index) => `
        Source ${index + 1}
        Chunk Index: ${chunk.chunkIndex}
        Content: ${chunk.content}
        `).join("\n\n");


        /*const response = await openai.responses.create({
          model: "gpt-5.5",
          instructions: `
        You are a document Q&A assistant.  
        Answer only using the retrieved document chunks.
        Include the source number you used, like: "Based on Source 2..."
        If the answer is not in the retrieved chunks, say:
        "I could not find that information in the document."
          `,
          input: `
        Document name:
        ${document.name}
        
        Retrieved document chunks:
        ${context}
        
        User question:
        ${args.question}

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: response.output_text,
          },
           
        });

        return {
          answer: response.output_text,
        }
          `,
        });*/

        const aiServiceUrl = process.env.AI_SERVICE_URL;

        if(!aiServiceUrl) {
          throw new Error("API_SERVICE_URL is not configured");
        }

        const aiResponse = await fetch(`${aiServiceUrl}/answer-question`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: args.question,
            context,
            mode: "selected",

          }),
        });

        if(!aiResponse.ok) {
          throw new Error("AI service failed to answer question");
        }

        const data: {
          answer: string
        } = await aiResponse.json();

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: data.answer,
          }
        })

        return {
          answer: data.answer,
        }


        

      },
      askAcrossDocuments: async (
        _parent,
        args: { question: string }
      ) => {
        const relevantChunks = await retrieveAcrossDocuments(args.question);

        if(relevantChunks.length === 0) {
          return {
            answer: "I could not find any relevant information across your uploaded documents.",
            sources: [],
          };
        }

        const sources = relevantChunks.map((chunk, index) => ({
            sourceNumber: index + 1,
            documentId: chunk.documentId,
            documentName: chunk.documentName,
            chunkIndex: chunk.chunkIndex,
            similarity: chunk.similarity,
            preview: chunk.content.slice(0, 250),
        }));

        const context = relevantChunks
        .map((chunk, index) => {
          return `
             Source: ${index + 1}
             Document: ${chunk.documentName}
             Document ID: ${chunk.documentId}
             Chunk Index: ${chunk.chunkIndex}
             Content:
             ${chunk.content}
          `
          }).join("\n\n");

      /*  const response = await openai.responses.create({
          model: "gpt-5.5",
          instructions: `
               You are a multi-document Q&A assistant.

               Answer only using the retrieved document chunks.
               When answering, cite the source number and document name.
               Example: "Based on Source 2 from Resume.pdf..."

               If the answer is not in the retrieved chunks, say:
               I could not find that information in the uploaded documents."
          `,
          input: `
              Retrieved document chunks: ${context}

              User question: ${args.question}
          `,
        });

        console.log("Ask Across Documents Result:");
        console.log(relevantChunks);


        return {
           answer: response.output_text,
           sources,
           
        }*/

          const aiServiceUrl = process.env.AI_SERVICE_URL;

          if(!aiServiceUrl) {
            throw new Error("AI_SERVICE_URL is not configured");
          }

          const aiResponse = await fetch(`${aiServiceUrl}/answer-question`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              question: args.question,
              context,
              mode: "all",
            }),
          });

          if(!aiResponse.ok) {
            throw new Error("AI service failed to answer across documents");
          }

          const data: {
            answer: string;
          } = await aiResponse.json();

          return {
            answer: data.answer,
            sources,
          }
      },
      analyzeDocument: async (
        _parent,
        args: { documentId: string }
      ) => {

         const document = await prisma.document.findUnique({
            where: {
              id: args.documentId,
            },
         });

         if(!document) {
            throw new Error("Document not found");
         }

         if(document.status !== "ready") {
            throw new Error("Document is not ready for analysis");
         }

         const chunks = await prisma.documentChunk.findMany({
           where: {
            documentId: args.documentId,
           },
           orderBy: {
              chunkIndex: "asc",
           },
           take: 12,
         });

         if(chunks.length === 0) {
            return {
              analysis: "I could not analyze this document because no chunks were found.",
            };
         }

         
         const aiServiceUrl = process.env.AI_SERVICE_URL;

         if(!aiServiceUrl) {
            throw new Error("AI_SERVICE_URL is not configured");
         }

         const response = await fetch(`${aiServiceUrl}/analyze-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentName: document.name,
            chunks: chunks.map((chunk) => chunk.content),
          }),
         });

         if(!response.ok) {
            throw new Error("AI service failed to analyze document");
         }

         const data: { analysis: string } = await response.json();

         return {
          analysis: data.analysis,
         }

      },
      researchAcrossDocuments: async(
        _parent,
        args: {
          question: string;
        }
      ) => {

        const relevantChunks = await retrieveAcrossDocuments(args.question);

        if(relevantChunks.length === 0) {
          return {
            report: "I could not find enough relevant information across your uploaded documents to create a research report.",
            sources: [],
          }
        }

        const sources = relevantChunks.map((chunk, index) => ({
          sourceNumber: index + 1,
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          chunkIndex: chunk.chunkIndex,
          similarity: chunk.similarity,
          preview: chunk.content.slice(0, 250),
        }));

        const context = relevantChunks.map((chunk, index) => {
          return `
               Source: ${index + 1}
               Document Id: ${chunk.documentId}
               Document: ${chunk.documentName}
               Chunk Index: ${chunk.chunkIndex}
               Content: ${chunk.content}

          `
        }).join("\n\n");

        const aiServiceUrl = process.env.AI_SERVICE_URL;

        if(!aiServiceUrl) {
          throw new Error("AI_SERVICE_URL is not configured");
        }

        const aiResponse = await fetch(`${aiServiceUrl}/research`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
              question: args.question,
              context,
          }),
        });

        if(!aiResponse.ok) {
            throw new Error("AI service failed to create research report");
        }

        const data: {
           report: string;
        } = await aiResponse.json();

        return {
          report: data.report,
          sources,
        };

      },
      compareDocuments: async (
        _parent,
        args: { documentAId: string; documentBId: string }
      ) => {
        if (args.documentAId === args.documentBId) {
          throw new Error("Please select two different documents to compare.");
        }
      
        const documentA = await prisma.document.findUnique({
          where: {
            id: args.documentAId,
          },
        });
      
        const documentB = await prisma.document.findUnique({
          where: {
            id: args.documentBId,
          },
        });
      
        if (!documentA || !documentB) {
          throw new Error("One or both documents were not found.");
        }
      
        if (documentA.status !== "ready" || documentB.status !== "ready") {
          throw new Error("Both documents must be ready before comparison.");
        }
      
        const documentAChunks = await prisma.documentChunk.findMany({
          where: {
            documentId: documentA.id,
          },
          orderBy: {
            chunkIndex: "asc",
          },
          take: 15,
        });
      
        const documentBChunks = await prisma.documentChunk.findMany({
          where: {
            documentId: documentB.id,
          },
          orderBy: {
            chunkIndex: "asc",
          },
          take: 15,
        });

        console.log("Compare document A:", documentA.id, documentA.name);
        console.log("Compare document B:", documentB.id, documentB.name);
        console.log("Document A chunks:", documentAChunks.length);
        console.log("Document B chunks:", documentBChunks.length);
      
        if (documentAChunks.length === 0 || documentBChunks.length === 0) {
          throw new Error("One or both documents do not have chunks.");
        }
      
        const aiServiceUrl = process.env.AI_SERVICE_URL;
      
        if (!aiServiceUrl) {
          throw new Error("AI_SERVICE_URL is not configured");
        }
      
        const aiResponse = await fetch(`${aiServiceUrl}/compare-documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentAName: documentA.name,
            documentBName: documentB.name,
            documentAChunks: documentAChunks.map((chunk) => chunk.content),
            documentBChunks: documentBChunks.map((chunk) => chunk.content),
          }),
        });
      
        if (!aiResponse.ok) {
          throw new Error("AI service failed to compare documents");
        }
      
        const data: { comparison: string } = await aiResponse.json();
      
        return {
          comparison: data.comparison,
        };
      },
    },
  },
});

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
});

export {
  yoga as GET,
  yoga as POST,
};

