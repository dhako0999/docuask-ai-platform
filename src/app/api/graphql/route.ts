import { createSchema, createYoga } from "graphql-yoga";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { openai } from "@/lib/openai";


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

  `,

  resolvers: {
    Query: {
      documents: async () => {
        return prisma.document.findMany({
          orderBy: {
            uploadedAt: "desc",
          },
        });
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
          }
        }
      ) => {
        return prisma.document.create({
           data: {
              name: args.input.name,
              size: args.input.size,
              type: args.input.type,
              s3Key: args.input.s3Key,
              content: args.input.content,
              status: args.input.status,
           },

        });
      },
      askQuestion: async (
        _parent,
        args: { documentId: string, question: string }
      ) => {
        const document = await prisma.document.findUnique({
          where: {
            id: args.documentId
          }
        });

        if(!document) {
          throw new Error("Document not found");
        }

        let conversation = await prisma.conversation.findFirst({
          where: {
            documentId: args.documentId
          },
        });


        if(!conversation) {
           conversation = await prisma.conversation.create({
               data: {
                  documentId: args.documentId
               },
           });
        }

        const response = await openai.responses.create({
          model: "gpt-5.5",
          instructions: `
              You are a document Q&A assistant.
              Answer only using the provided document content.
              If the answer is not in the document, say:
              "I could not find that information in the document."
          `,
          input: `
              Document name: ${document.name}
              Document content: ${document.content.slice(0, 12000)}
              User question: ${args.question}
          `,

        });

        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: args.question,
          },
            
        });

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

      }
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

