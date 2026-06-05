import { createSchema, createYoga } from "graphql-yoga";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
      name: String!,
      size: Int!,
      type: String!,
      s3Key: String!,
      content: String!,
      status: String!
    }

    type Query {
      documents: [Document!]!
    }

    type Mutation {
      createDocument(input: CreateDocumentInput!): Document!
      deleteDocument(id: ID!): Boolean!
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

