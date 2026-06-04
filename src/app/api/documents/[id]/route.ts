import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    },
});

export async function DELETE(
    req: Request,
    { params } : { params: Promise<{ id: string}>}
) {
    try {

        const { id } = await params;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if(!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: document.s3Key,
            })
        );

        await prisma.document.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error("Delete document error:", error);
      
        return NextResponse.json(
          {
            error: "Failed to delete document",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
    }
}


