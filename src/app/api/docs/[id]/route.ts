import { auth } from "@/lib/auth";         // if alias fails, use ../../../../lib/auth
import { prisma } from "@/lib/db";         // or ../../../../lib/db

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // v4 typing: cast to read the id we added in callbacks
  const userId = (session.user as any).id as string;

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc || doc.userId !== userId) return new Response("Not found", { status: 404 });

  return Response.json(doc);
}
