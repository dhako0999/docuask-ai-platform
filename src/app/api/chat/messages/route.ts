import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
     
    const body: {
        documentId: string;
        role: "user" | "assistant";
        content: string;
    } = await req.json();

    let conversation = await prisma.conversation.findFirst({
        where: {
            documentId: body.documentId,
        },
    });

    if(!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                documentId: body.documentId,
            },
        });
    }

    const message = await prisma.chatMessage.create({
        data: {
            conversationId: conversation.id,
            role: body.role,
            content: body.content,
        },
    });

    return Response.json({ message });
}