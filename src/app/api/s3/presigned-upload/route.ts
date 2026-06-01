import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const key = `uploads/${crypto.randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      { expiresIn: 60 }
    );

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("S3 presigned URL error:", error);

    return NextResponse.json(
      { error: "Failed to create upload URL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}