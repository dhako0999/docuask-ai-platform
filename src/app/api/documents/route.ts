import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
      const body = await req.json();
  
      const document = await prisma.document.create({
        data: {
          name: body.name,
          size: body.size,
          type: body.type,
          s3Key: body.s3Key,
          content: body.content,
          status: body.status,
        },
      });
  
      return NextResponse.json(document);
    } catch (error) {
      console.error(error);
  
      return NextResponse.json(
        {
          error: "Failed to create document",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }