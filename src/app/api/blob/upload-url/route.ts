import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Build options; include token locally if you set BLOB_READ_WRITE_TOKEN
  const opts: Parameters<typeof put>[2] = { access: "public" };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    (opts as any).token = process.env.BLOB_READ_WRITE_TOKEN; // fine if your @vercel/blob types include token
  }

  const blob = await put(
    `pdfs/${crypto.randomUUID()}-${file.name}`,
    await file.arrayBuffer(),
    opts
  );

  return NextResponse.json({ url: blob.url });
}
