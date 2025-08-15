// src/app/api/speech-to-text/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const audio = new File([await file.arrayBuffer()], "audio.webm", { type: "audio/webm" });
  const tr = await openai.audio.transcriptions.create({
    file: audio as any,
    model: "whisper-1"
  } as any);

  return NextResponse.json({ text: (tr as any).text || "" });
}
