// src/app/api/ensure-session/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";   // if alias fails, use ../../../../lib/auth
import { prisma } from "@/lib/db";   // or ../../../../lib/db

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // v4 typing: we added id in callbacks; cast to read it
  const userId = (session.user as any).id as string;

  const documentId = new URL(req.url).searchParams.get("documentId");
  if (!documentId) return new Response("documentId required", { status: 400 });

  let s = await prisma.chatSession.findFirst({
    where: { userId, documentId },
    orderBy: { createdAt: "desc" },
  });

  if (!s) {
    s = await prisma.chatSession.create({
      data: { userId, documentId, title: "Session" },
    });
  }

  return Response.json({ chatSessionId: s.id });
}
