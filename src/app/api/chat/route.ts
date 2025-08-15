// src/app/api/chat/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

const clip = (s: string, max = 1600) => (s && s.length > max ? s.slice(0, max) + " …" : s || "");

async function callOpenAI(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const openai = new OpenAI({ apiKey: key });
  const r = await openai.chat.completions.create({
    // if your account lacks 4o access, change to "gpt-3.5-turbo"
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });
  return r.choices?.[0]?.message?.content ?? "";
}

async function callGroq(prompt: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  // Known-good Groq models:
  const models = ["llama3-70b-8192", "llama3-8b-8192"];
  let lastErr = "Unknown Groq error";
  for (const model of models) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      try {
        const j = JSON.parse(raw);
        lastErr = j?.error?.message || raw || `HTTP ${res.status}`;
      } catch {
        lastErr = raw || `HTTP ${res.status}`;
      }
      continue; // try next model
    }
    const j = JSON.parse(raw);
    return j?.choices?.[0]?.message?.content ?? "";
  }
  throw new Error(lastErr);
}

async function generateAnswer(prompt: string) {
  const prefer = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  if (prefer === "groq") {
    // force groq
    return await callGroq(prompt);
  }
  // try openai first, then groq fallback on common quota/key errors
  try {
    return await callOpenAI(prompt);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const isQuota = /quota|billing|insufficient/i.test(msg);
    const isKey = /api key|unauthorized|401/i.test(msg);
    if (!process.env.GROQ_API_KEY) throw new Error(`OpenAI error: ${msg}`);
    if (isQuota || isKey) return await callGroq(prompt);
    // generic failure → try groq anyway
    return await callGroq(prompt);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return new Response("Bad JSON", { status: 400 });

    const { documentId, chatSessionId, messages } = body as {
      documentId?: string;
      chatSessionId?: string;
      messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    };

    if (!documentId || !Array.isArray(messages) || !messages.length) {
      return new Response("Bad Request: need documentId and messages[]", { status: 400 });
    }

    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Retrieval from PageText (simple contains)
    let pages: { page: number; content: string }[] = [];
    try {
      const hits = await prisma.pageText.findMany({
        where: lastUserMsg
          ? {
              documentId,
              content: { contains: lastUserMsg.slice(0, 200), mode: "insensitive" },
            }
          : { documentId },
        select: { page: true, content: true },
        orderBy: { page: "asc" },
        take: lastUserMsg ? 4 : 3,
      });
      pages = hits.length ? hits : await prisma.pageText.findMany({
        where: { documentId },
        select: { page: true, content: true },
        orderBy: { page: "asc" },
        take: 3,
      });
    } catch {
      pages = [];
    }

    const context =
      (pages.length ? pages : [{ page: 1, content: "(no page text available)" }])
        .map((p) => `--- Page ${p.page} ---\n${clip(p.content, 2000)}`)
        .join("\n\n");

    const prompt =
      `PDF Context:\n${context}\n\n` +
      `Question: ${lastUserMsg}\n` +
      `Remember: finish with ONE JSON line of actions.`; // per your SYSTEM_PROMPT

    const answer = await generateAnswer(prompt);

    // Save messages if ChatMessage table exists (cast avoids TS error if client not regenerated)
    if (chatSessionId) {
      await (prisma as any).chatMessage?.create({ data: { chatSessionId, role: "user", content: lastUserMsg } }).catch(()=>{});
      await (prisma as any).chatMessage?.create({ data: { chatSessionId, role: "assistant", content: answer } }).catch(()=>{});
    }

    return new Response(answer, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err: any) {
    return new Response(`Server error: ${err?.message || "unknown"}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
