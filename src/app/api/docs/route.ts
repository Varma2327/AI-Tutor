// src/app/api/docs/[id]/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // <- params is a Promise in Next 15
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id as string;

  const { id } = await ctx.params; // <- await it
  const doc = await prisma.document.findUnique({ where: { id } });

  if (!doc || doc.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(doc);
}
