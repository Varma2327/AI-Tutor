import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const chatSessionId = new URL(req.url).searchParams.get("chatSessionId");
  if (!chatSessionId) return new Response("chatSessionId required", { status: 400 });

  // src/app/api/chat/history/route.ts
// ...
  try {
    const messages = await (prisma as any).chatMessage.findMany({
      where: { chatSessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true },
    });
    return Response.json({ messages });
  } catch (e: any) {
// ...

    // Don’t crash if your DB/migration isn’t ready yet
    console.error("history error:", e?.message || e);
    return Response.json({ messages: [] });
  }
}
