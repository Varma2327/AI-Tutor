// src/app/api/text-to-speech/route.ts
import { NextRequest } from "next/server";
import { openai } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const audio = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text || ""
  } as any);

  const arrayBuffer = await audio.arrayBuffer();
  return new Response(Buffer.from(arrayBuffer), { headers: { "Content-Type": "audio/mpeg" }});
}
