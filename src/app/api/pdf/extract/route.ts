import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createRequire } from "module";

export const runtime = "nodejs";

// pdfjs-dist v3.x (works in Next API routes)
const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/legacy/build/pdf.worker.js");

async function extractPages(bytes: Uint8Array): Promise<{ pages: string[]; pageCount: number }> {
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,                 // 👈 MUST be Uint8Array
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: true,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const pageCount = doc.numPages;
  const pages: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .join(" ");
    pages.push(text);
    // @ts-ignore
    page.cleanup?.();
  }
  // @ts-ignore
  doc.cleanup?.();
  // @ts-ignore
  doc.destroy?.();

  return { pages, pageCount };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;

    const { blobUrl, title } = (await req.json().catch(() => ({}))) as {
      blobUrl?: string;
      title?: string;
    };
    if (!blobUrl) return NextResponse.json({ error: "blobUrl required" }, { status: 400 });

    console.log("extract blobUrl:", blobUrl);
    const resp = await fetch(blobUrl);
    if (!resp.ok) return NextResponse.json({ error: `Failed to fetch PDF: ${resp.status}` }, { status: 400 });

    // 👇 convert to Uint8Array (NOT Buffer)
    const u8 = new Uint8Array(await resp.arrayBuffer());

    const { pages, pageCount } = await extractPages(u8);

    const doc = await prisma.document.create({
      data: { userId, title: title || "Untitled PDF", blobUrl, pageCount },
    });

    const records =
      pages.length > 0
        ? pages.map((content, i) => ({ documentId: doc.id, page: i + 1, content }))
        : [{ documentId: doc.id, page: 1, content: "" }];
    if (records.length) await prisma.pageText.createMany({ data: records });

    const s = await prisma.chatSession.create({
      data: { userId, documentId: doc.id, title: doc.title },
    });

    return NextResponse.json({ documentId: doc.id, chatSessionId: s.id });
  } catch (err: any) {
    console.error("extract failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to extract PDF" }, { status: 500 });
  }
}
